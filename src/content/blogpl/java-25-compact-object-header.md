---
title: "Kompaktowe nagłówki obiektów w Javie 25"
description: "Wpływ kompaktowych nagłówków obiektów w Javie 25 na zużycie pamięci i wydajność."
pubDate: "2025-10-04"
tags: ["Java", "Performance", "Memory", "JVM"]
---

Jako programiści Javy stale szukamy sposobów, by aplikacje działały szybciej i zużywały mniej zasobów. Java 25 oferuje funkcję **Compact Object Headers** (JEP 519), czyli kompaktowe nagłówki obiektów.

Nazwa może brzmieć skomplikowanie, ale pomysł jest prosty, a potencjalne korzyści duże. Sprawdźmy to!

---

## Czym właściwie są nagłówki obiektów?

Za każdym razem, gdy tworzysz obiekt w Javie (`new MyObject()`), JVM dołącza do niego metadane nazywane **nagłówkiem**. To swego rodzaju dowód osobisty obiektu, zawierający informacje takie jak:

- Do jakiej klasy należy obiekt?
- Czy jest zablokowany przez wątek?
- Dane potrzebne mechanizmowi odśmiecania pamięci (GC).

Historycznie w typowym systemie 64-bitowym nagłówek zajmował **12 bajtów** (96 bitów): 64-bitowe słowo znacznikowe oraz 32-bitowy wskaźnik klasy.

12 bajtów wydaje się niewielką ilością. Ale przy milionach lub miliardach drobnych obiektów różnica robi się duża!

---

## Co zmienia Java 25?

Java 25 pozwala zmniejszyć nagłówek obiektu z 12 do **8 bajtów**.

Jak? Łączy słowo znacznikowe i wskaźnik klasy w jednym polu 64-bitowym. Funkcja ma teraz status **produkcyjny**. W Javie 24 wymagała włączenia funkcji eksperymentalnych przez _-XX:+UnlockExperimentalVMOptions_.

Potencjalne korzyści to:

- **Mniejsze zużycie pamięci**: mniejsze obiekty zmniejszają zapotrzebowanie aplikacji na pamięć.
- **Mniej pracy dla GC**: mniejsze zużycie pamięci może ograniczyć częstotliwość odśmiecania.
- **Mniejsze obciążenie CPU**: mniej czasu poświęconego na GC zostawia procesorowi więcej czasu na pracę aplikacji.

Zmiana może być szczególnie przydatna w aplikacjach tworzących wiele małych obiektów, takich jak mikroserwisy i systemy przetwarzania danych.

---

## Sprawdźmy to: prosty benchmark

Przygotujmy prostą aplikację w Javie, która tworzy wiele małych obiektów, i sprawdźmy jej zachowanie za pomocą narzędzia monitorującego.

### Narzędzie: JConsole

**jconsole** jest dostarczane z JDK i pozwala na bieżąco obserwować zużycie pamięci, CPU, wątki i pracę GC.

### Kod

Poniższa aplikacja tworzy małe obiekty w porcjach po 30 tysięcy, aż upłynie zadany czas.

```java
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

public class BenchmarkApp {

    static class SmallObject {
        private int data;

        public SmallObject(int data) {
            this.data = data;
        }
    }

    private static final long RUN_DURATION_MS = TimeUnit.MINUTES.toMillis(2);

    public static void main(String[] args) throws InterruptedException {
        System.out.println("--- GC Benchmark Application ---");
        System.out.println("Process ID: " + ProcessHandle.current().pid());
        System.out.println("Initial pause (20s) to connect profiler :)");

        Thread.sleep(20000);

        System.out.println("We're starting the loop of allocation.");
        System.out.println("Observe the usage of heap, CPU and GC spent time!");

        long startTime = System.currentTimeMillis();

        while (System.currentTimeMillis() - startTime < RUN_DURATION_MS) {

            List<SmallObject> transientObjects = new ArrayList<>();
            int numObjects = 30_000;

            for (int i = 0; i < numObjects; i++) {
                transientObjects.add(new SmallObject(i));
            }

            Thread.sleep(1);
        }
        System.out.println("The loop ended. App is exiting...");
    }
}


```

### Uruchomienie testu

Najpierw kompilujemy kod:

```bash
javac BenchmarkApp.java
```

Uruchomimy test dwa razy. Opcje `-Xms128m -Xmx128m` ustawiają stały rozmiar sterty na 128 MB, aby ułatwić porównanie.

#### **Próba 1: Java 25 bez kompaktowych nagłówków**

1. Uruchom aplikację:
   ```bash
   java -Xms128m -Xmx128m BenchmarkApp
   ```
2. Otwórz JConsole i połącz się z procesem `BenchmarkApp`.

#### **Próba 2: Java 25 z kompaktowymi nagłówkami**

1. Uruchom aplikację ponownie z flagą `-XX:+UseCompactObjectHeaders`:
   ```bash
   java -XX:+UseCompactObjectHeaders -Xms128m -Xmx128m BenchmarkApp
   ```
2. Ponownie otwórz JConsole i połącz się z nowym procesem.

## Porównaj wyniki!

## Analiza wyników

Wybrałem jeden z kilku przebiegów. Wszystkie dawały bardzo podobne wyniki.

| Scenariusz                     | Odśmiecania młodej generacji | Czas GC  |
| :----------------------------- | :--------------------------- | :------- |
| **Bez kompaktowych nagłówków** | 1592                         | ≈1,291 s |
| **Z kompaktowymi nagłówkami**  | 1374                         | ≈1,055 s |

**Werdykt**
Różnica była niewielka.

- Liczba odśmiecań spadła z 1592 do 1374, a czas GC skrócił się o około 0,236 s.
- W tak prostej aplikacji nie jest to przekonujący dowód znaczącego wzrostu wydajności.
- Zużycie CPU utrzymywało się na poziomie około 10%, więc test nie obciążał systemu wystarczająco mocno, aby dobrze pokazać potencjał tej funkcji.

---

## Wnioski: mała zmiana, którą warto sprawdzić

Test na własnym komputerze nie daje pełnego obrazu zachowania w produkcji. Kompaktowe nagłówki mogą być szczególnie przydatne w:

- dużych, złożonych aplikacjach obsługujących duży ruch;
- systemach o dużej przepustowości, które stale tworzą i porzucają obiekty.

W takich warunkach mniejsze zużycie pamięci i lepsze wykorzystanie pamięci podręcznej CPU mogą dać zauważalne korzyści.

Wypróbuj tę flagę we własnej aplikacji i porównaj wyniki. Miłego programowania!
