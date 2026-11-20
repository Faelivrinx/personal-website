---
title: "Logowanie z Grafana Loki"
description: "Prosta konfiguracja Grafana Loki jako alternatywy dla stosu ELK."
pubDate: "2024-07-25"
tags: ["Logging", "Kubernetes", "DevOps", "Observability", "Loki"]
---

Logi są ważną częścią codziennej pracy programisty. Pomagają zrozumieć działanie aplikacji i wykrywać problemy. Zarządzanie nimi bywa jednak trudne, szczególnie w złożonych systemach.

Jako programista Javy często wybierałem stos ELK do centralnego zarządzania logami. Jest popularny i ma biblioteki ułatwiające integrację. Elasticsearch oferuje rozbudowane wyszukiwanie pełnotekstowe dzięki indeksowaniu treści.

Ma to jednak swoją cenę: rozbudowane indeksowanie i zaawansowane zapytania wymagają większej ilości zasobów.

Dlatego postanowiłem sprawdzić Grafana Loki, które ogranicza indeksowanie, aby oszczędzać zasoby.

## Wymagania

- minikube lub klaster Kubernetes
- Helm

## Konfiguracja chartu Helm dla Grafany

Wybrałem środowisko Minikube i Helm, menedżer pakietów dla Kubernetes. Helm upraszcza konfigurację systemów rozproszonych. Mogłem skorzystać z Dockera lub maszyny wirtualnej, ale chciałem przetestować rozwiązanie w klastrze Kubernetes.

`helm repo add grafana https://grafana.github.io/helm-charts`

Po dodaniu repozytorium zaktualizowałem lokalną pamięć podręczną chartów:

`helm repo update`

Następnie wyeksportowałem domyślne ustawienia Loki do pliku, który mogłem dostosować do swojego wdrożenia:

`helm show values grafana/loki-stack > loki.yaml`

W pliku loki.yaml wprowadziłem potrzebne zmiany. Oto moja konfiguracja:

```yaml
---
loki:
  enabled: true
  isDefault: true
  url: http://{{(include "loki.serviceName" .)}}:{{ .Values.loki.service.port }}
  readinessProbe:
    httpGet:
      path: /ready
      port: http-metrics
    initialDelaySeconds: 45
  livenessProbe:
    httpGet:
      path: /ready
      port: http-metrics
    initialDelaySeconds: 45
  datasource:
    jsonData: "{}"
    uid: ""

promtail:
  enabled: true # {1}
  config:
    logLevel: info
    serverPort: 3101
    clients:
      - url: http://{{ .Release.Name }}:3100/loki/api/v1/push
    snippets: # {3}
      pipelineStages:
        - json:
            expressions:
              log: log
              stream: stream
              time: time
        - json:
            source: log
            expressions:
              ip: ip
              level: level
              method: method
              msg: msg
              route: route
              inner_time: time
        - labels:
            route:
            method:
            msg:
            level:

grafana:
  enabled: true # {2}
  sidecar:
    datasources:
      label: ""
      labelValue: ""
      enabled: true
      maxLines: 1000
  image:
    tag: latest
```

Najważniejsze jest włączenie Promtail {1} i Grafany {2}. Dodałem też ustawienia {3} wyciągające dane z logów JSON do etykiet level, method i msg. Ta część jest opcjonalna i dopasowana do przykładowej aplikacji z kolejnego kroku.

Teraz mogłem zastosować konfigurację i zainstalować grafana/loki-stack:

`helm upgrade --install --values loki.yaml loki grafana/loki-stack -n loki-playground --create-namespace`

Polecenie zakończyło się potwierdzeniem, że Loki jest wdrożone i gotowe do pracy.

## Przykładowa aplikacja

Aby pokazać zbieranie i przeszukiwanie logów, przygotowałem aplikację w Go. Poniżej znajdują się pliki potrzebne do jej uruchomienia.

**main.go**

```go
package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/sirupsen/logrus"
)

var log = logrus.New()

func main() {
	log.SetFormatter(&logrus.JSONFormatter{})
	log.SetOutput(os.Stdout)

	http.HandleFunc("/status", func(w http.ResponseWriter, r *http.Request) {
		log.WithFields(logrus.Fields{
			"method": r.Method,
			"route":  r.URL.Path,
			"ip":     r.RemoteAddr,
		}).Info("Health check endpoint hit")

		w.WriteHeader(http.StatusOK)
		fmt.Fprintf(w, "OK")
	})

	log.Info("starting server on :8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("Error starting server: %v", err)
	}
}

```

**Dockerfile**

```docker
FROM golang:1.22 as builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /golang-app

FROM alpine:latest
WORKDIR /root/
COPY --from=builder /golang-app .
EXPOSE 8080
CMD ["./golang-app"]
```

**deployment.yaml**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: golang-app
  labels:
    app: golang-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: golang-app
  template:
    metadata:
      labels:
        app: golang-app
    spec:
      containers:
        - name: golang-app
          image: dj/golang-app:latest
          imagePullPolicy: Never
          ports:
            - containerPort: 8080
          env:
            - name: LOG_LEVEL
              value: "info"
```

**service.yaml**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: golang-app-service
spec:
  selector:
    app: golang-app
  ports:
    - protocol: TCP
      port: 8080
      targetPort: 8080
  type: NodePort
```

Z tymi plikami wdrożyłem golang-app do klastra Kubernetes:

```bash
docker build -t dj/golang-app:latest .
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
```

Jeśli te polecenia są Ci nieznane, warto najpierw poznać podstawy Dockera i Kubernetes.

Stan wdrożenia można sprawdzić poleceniem:

```bash
kubectl get all -n default
```

## Loki

Do uzyskania dostępu do Grafany w Minikube pozostał jeden krok. Zamiast NodePort wybrałem przekierowanie portu:

```bash
kubectl port-forward pod/loki-grafana-b86d8579f-76tr9 9090:3000 -n loki-playground # {1}
```

Dokładną nazwę poda Grafany sprawdziłem za pomocą `kubectl get pod -n loki-playground`.

Następnie odczytałem wygenerowane hasło do Grafany:

```bash
kubectl get secret --namespace loki-playground loki-grafana -o jsonpath="{.data.admin-password}" | base64 --decode ; echo
```

Grafana była dostępna pod adresem `http://localhost:9090`.

W Grafanie otworzyłem sekcję „Explore” i wybrałem źródło „Loki (default)”, aby przeszukiwać logi.

![grafana loki explore](/assets/images/grafana_loki.png)

Wszystko wyglądało dobrze, ale po wybraniu etykiety _app=golang-app_ nie było jeszcze żadnych logów. Czas je wygenerować!

Aplikacja działa w domyślnej przestrzeni nazw i jest udostępniona przez NodePort. Potrzebowałem adresu IP Minikube i numeru portu, aby wysłać do niej żądanie.

```bash
minikube ip # {1}
kubectl get svc -n default # {2}
```

Po sprawdzeniu adresu IP Minikube {1} i NodePort {2} wysłałem żądanie GET:
`curl http://<minikube-ip>:<nodeport>/status`

U mnie było to `curl http://192.168.49.2:30641/status`.

Pierwsze logi pojawiły się w Grafanie!

![grafana loki query](/assets/images/grafana_loki_query.png)

## Podsumowanie

Dzięki chartom Helm konfiguracja Loki była stosunkowo prosta. Po włączeniu Grafany i parsowania logów JSON wszystkie elementy zaczęły ze sobą współpracować.

Samo uruchomienie Loki jest łatwe, ale opanowanie zaawansowanych opcji, takich jak etapy przetwarzania logów, wymaga więcej pracy.

Loki jest narzędziem projektowanym z myślą o agregowaniu logów. Elasticsearch oferuje znacznie bardziej rozbudowane wyszukiwanie. Jeśli zależy Ci głównie na logach, Loki jest rozwiązaniem wartym sprawdzenia.
