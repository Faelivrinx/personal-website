---
title: "Pipeline CD oparty na GitOps z ArgoCD"
description: "Lokalny pipeline GitOps z Harbor, GitLab Runnerem i ArgoCD na Minikube."
pubDate: "2024-09-25"
tags: ["DevOps", "GitOps", "Kubernetes", "CI/CD", "ArgoCD"]
---

Postanowiłem zbudować lokalny pipeline Continuous Delivery (CD) z użyciem Harbor, GitLab Runnera i ArgoCD. Środowiskiem był klaster Minikube. Celem był kompletny, ale prosty proces wdrażania i zarządzania aplikacjami Kubernetes — punkt wyjścia do bardziej rozbudowanych rozwiązań.

Harbor miał pełnić rolę rejestru obrazów kontenerów, GitLab Runner obsługiwać pipeline CI/CD, a ArgoCD synchronizować klaster Kubernetes z repozytorium Git.

Efektem miał być w pełni działający pipeline.

## Wymagania

- **Klaster Kubernetes** (u mnie Minikube)
- **Włączony Ingress**
- **Helm**
- **kubectl**

## Harbor

Harbor to otwarty rejestr kontenerów do bezpiecznego przechowywania, zarządzania i skanowania obrazów Docker. W tym pipeline GitLab Runner wysyła do niego zbudowane obrazy, a klaster Kubernetes pobiera je podczas wdrażania.

Zacząłem od dodania repozytorium chartów Helm dla Harbor. Lubię korzystać z Helm, ponieważ oszczędza czas i zazwyczaj wymaga niewielu zmian w domyślnej konfiguracji.

Dodałem repozytorium następującymi poleceniami:

```bash
helm repo add harbor https://helm.goharbor.io
helm repo update
```

Następnie pobrałem domyślną konfigurację Harbor:

```bash
helm show values harbor/harbor > harbor.yaml
```

Polecenie zapisuje domyślne wartości chartu w **harbor.yaml**. Zachowanie takiego pliku ułatwia przegląd ustawień. Domyślnie chart włącza Ingress i udostępnia Harbor pod domeną **core.harbor.domain**.

Z gotowym plikiem harbor.yaml zainstalowałem Harbor w Minikube za pomocą Helm:

```bash
helm install harbor harbor/harbor --namespace=registry --create-namespace -f harbor.yaml
```

Harbor został zainstalowany z ustawieniami z **harbor.yaml** w przestrzeni nazw registry.

Aby otworzyć interfejs Harbor, dodałem do /etc/hosts wpis wiążący adres IP Minikube (_$ minikube ip_) z domeną rejestru:

**/etc/hosts**

```
<minikube-ip> core.harbor.domain
```

Interfejs i API Harbor potrzebowały nazwy domenowej wskazującej klaster Minikube. Ten wpis pozwolił mi korzystać z core.harbor.domain zarówno w przeglądarce, jak i przy wysyłaniu lub pobieraniu obrazów.

Po edycji pliku zrestartowałem systemową usługę nazwy hosta:

```bash
sudo systemctl restart systemd-hostnamed
```

Po tych krokach interfejs Harbor był dostępny pod adresem **core.harbor.domain**.

W tym lokalnym środowisku użyłem danych logowania:<br>
Użytkownik: **admin**
Hasło: **Harbor12345**

### Harbor CA

Następnie pobrałem certyfikat główny rejestru z interfejsu Harbor:
**Configuration -> System Settings -> Repository Root Certificate**

Zapisałem certyfikat jako **ca.crt**.

Docker domyślnie korzysta z TLS, dlatego pod GitLab Runnera musiał ufać temu certyfikatowi. Konfigurację opisuję w kolejnym rozdziale.

## Gitlab Runner

Konfigurację GitLab Runnera zacząłem od dodania repozytorium Helm:

```bash
helm repo add gitlab https://charts.gitlab.io
helm repo update gitlab
helm show values gitlab/gitlab-runner > gitlab.yaml
```

Aby bezpiecznie połączyć GitLab Runnera z Harbor, utworzyłem sekret Kubernetes z certyfikatem CA:

```bash
kubectl create secret generic harbor-ca-certs --from-file=ca.crt=ca.crt --namespace gitlab-runner # ca.crt
```

Polecenie tworzy sekret **harbor-ca-certs** w przestrzeni **gitlab-runner** z plikiem certyfikatu. Dzięki temu runner może ufać połączeniom TLS rejestru. Zobacz [Harbor CA](#harbor-ca).

Następnie przygotowałem plik konfiguracji:

```yaml
concurrent: 1
rbac:
  create: true
  rules:
    - apiGroups: [""]
      resources:
        [
          "configmaps",
          "events",
          "pods",
          "pods/attach",
          "pods/exec",
          "pods/logs",
          "secrets",
          "services",
        ]
      verbs: ["get", "list", "watch", "create", "patch", "update", "delete"]
runners:
  config: |
    [[runners]]
      executor = "kubernetes"
      [runners.kubernetes]
        namespace = "{{.Release.Namespace}}"
        image = "docker:20.10"
        privileged = true
        allow_privilege_escalation = true
        [[runners.kubernetes.volumes.secret]]
          name = "harbor-ca-certs"  # This secret holds the Harbor CA cert
          mount_path = "/etc/docker/certs.d/core.harbor.domain/"
          read_only = true
        [[runners.kubernetes.volumes.empty_dir]]
          name = "repo"
          mount_path = "/builds"
          medium = "Memory"
```

Najważniejsze ustawienia znajdują się w sekcji **[[runners]]**.

Potrzebowałem uruchamiać kontenery Docker wewnątrz pipeline, więc wybrałem obraz docker:20.10. Wersja okazała się istotna: problemy z nowszymi wersjami były związane ze znanym [błędem kontroli stanu GitLab Runnera](https://gitlab.com/gitlab-org/gitlab-runner/-/issues/27215). W moim środowisku obejściem było użycie starszej wersji Dockera.

- `privileged = true` pozwala uruchamiać Docker-in-Docker (DinD) i budować obrazy w pipeline.
- `[[runners.kubernetes.volumes.secret]]` montuje certyfikat CA Harbor pod `/etc/docker/certs.d/core.harbor.domain/`, aby Docker ufał rejestrowi.

Szczegóły znajdziesz w [dokumentacji GitLab](https://docs.gitlab.com/runner/executors/kubernetes/).

### Rejestracja GitLab Runnera

Z gotową konfiguracją mogłem zarejestrować i uruchomić runnera przez Helm.

Najpierw **zarejestrowałem** runnera w interfejsie GitLab, przechodząc do:

**Settings -> CI/CD -> Runners**

W tym miejscu wygenerowałem token do połączenia runnera z projektem:

![gitlab runner register](/assets/images/gitlab_runner_01.png)

Podczas rejestracji przypisałem tag **kubernetes**, aby pipeline mógł kierować do runnera odpowiednie zadania.

GitLab wygenerował token identyfikujący runnera:

![gitlab runner token](/assets/images/gitlab_runner_02.png)

Z tokenem mogłem zainstalować chart GitLab Runner:

```bash
helm install --namespace gitlab-runner --create-namespace --atomic --debug --timeout 120s --set gitlabUrl="https://gitlab.com" --set runnerToken="<token>" --values gitlab.yaml gitlab-runner gitlab/gitlab-runner --version 0.68.1
```

Znaczenie poszczególnych opcji:

- **--namespace gitlab-runner --create-namespace**: wybiera przestrzeń nazw i tworzy ją, jeśli nie istnieje.
- **--atomic**: wycofuje instalację w razie błędu.
- **--debug**: włącza szczegółowe logi.
- **--timeout 120s**: ustawia limit czasu instalacji na 120 sekund.
- **--set gitlabUrl="https://gitlab.com"**: wskazuje instancję GitLab.
- **--set runnerToken="<token>"**: przekazuje token uwierzytelniający runnera.
- **--values gitlab.yaml**: ładuje przygotowaną konfigurację.
  Po instalacji runner był gotowy do obsługi zadań z tagiem kubernetes.

## Repozytoria GitLab

Przygotowałem dwa repozytoria: [aplikacji Go](#repozytorium-aplikacji) i [konfiguracji klastra](#repozytorium-konfiguracji), która opisuje stan wdrożenia zarządzany przez ArgoCD.

### Repozytorium aplikacji

Pierwsze repozytorium zawiera pipeline GitLab automatyzujący wdrożenie. Po zbudowaniu nowej wersji aplikacji Go pipeline wysyła obraz do Harbor i aktualizuje wersję aplikacji w repozytorium konfiguracji klastra.

Dzięki integracji z ArgoCD repozytorium konfiguracji odzwierciedla najnowszą wersję aplikacji.

Ten schemat może być punktem wyjścia do własnego procesu CI/CD.

### Repozytorium konfiguracji

Drugie repozytorium opisuje docelowy stan aplikacji Go w Kubernetes. ArgoCD obserwuje je i automatycznie synchronizuje zmiany z klastrem.

## Argo CD

Ostatnim elementem było Argo CD.

ArgoCD to deklaratywne narzędzie GitOps dla Kubernetes. Obserwuje repozytoria Git i synchronizuje manifesty aplikacji z klastrem. W tym procesie pobiera konfigurację z Git i stosuje ją w Minikube, aby środowisko odpowiadało zadeklarowanemu stanowi.

Dodałem oficjalne repozytorium Helm ArgoCD i zapisałem domyślne ustawienia:

```bash
helm repo add argo https://argoproj.github.io/argo-helm
helm repo update
helm show values argo/argo-cd >> argo.yaml
```

W pliku **argo.yaml** dostosowałem następujące opcje:
**argo.yaml**

```yaml
ingres.enabled: true
server.insecure: true
```

- **ingres.enabled: true**: włącza Ingress, aby udostępnić interfejs ArgoCD pod domeną.
- **server.insecure: true**: wyłącza wymuszanie HTTPS na serwerze ArgoCD, co uprościło lokalną konfigurację Minikube.

Następnie zainstalowałem chart w przestrzeni nazw argocd:

```bash
helm install argocd argo/argo-cd --namespace argocd --create-namespace -f argo.yaml
```

Po instalacji odczytałem początkowe hasło administratora:

```bash
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```

Aby otworzyć interfejs pod argocd.example.com, dodałem wpis do **/etc/hosts**:

```
<minikube-ip> argocd.example.com
```

Po zalogowaniu podłączyłem [repozytorium konfiguracji](#repozytorium-konfiguracji) przez **Settings -> Repositories -> Connect Repo**:

![argocd repo configuration](/assets/images/argocd_01.png)

Następnie utworzyłem aplikację za pomocą manifestu golang-app:

```yaml
project: default
source:
  repoURL: git@gitlab.com:Faelivrinx/configuration.git # update to yours repository
  path: base/golang-app
  targetRevision: HEAD
destination:
  server: https://kubernetes.default.svc
  namespace: default
syncPolicy:
  automated: {}
```

Tak wygląda poprawnie skonfigurowana aplikacja:

![argocd application config](/assets/images/argocd_02.png).

### Testowanie procesu GitOps

Wysłałem zmianę do gałęzi master aplikacji Go. Pipeline zbudował nowy obraz, wysłał go do Harbor, zwiększył numer wersji poprawkowej i zaktualizował repozytorium konfiguracji. ArgoCD wykryło zmianę i wdrożyło nową wersję w Minikube.

## Podsumowanie

Zbudowałem lokalny pipeline Continuous Delivery oparty na GitOps: Harbor przechowuje obrazy, GitLab Runner wykonuje zadania CI, a ArgoCD wdraża aplikację w Kubernetes. Helm uprościł instalację narzędzi. Wysłanie zmian do repozytorium aplikacji uruchamia budowanie, wersjonowanie i wdrażanie bez ręcznych kroków, a stan klastra pozostaje zgodny z konfiguracją w Git.
