---
title: "Twój kod jest szybki. Zadania czekają w kolejce."
description: "Kolejki puli wątków mogą spowalniać aplikację mimo niskiego zużycia CPU. Mierz czas oczekiwania, aby zobaczyć to, czego nie pokazuje czas wykonania."
pubDate: "2026-11-20"
tags: ["Java", "Performance", "Concurrency"]
---

Aplikacja zwalnia wraz ze wzrostem ruchu. Zużycie CPU wygląda dobrze, a logika biznesowa wykonuje się szybko. Gdzie znika czas?

Warto sprawdzić kolejkę przed pulą wątków. Zadanie może spędzać więcej czasu w oczekiwaniu na wątek niż na samym wykonaniu.

## Czas wykonania to tylko część historii

Wyobraź sobie pulę z jednym wątkiem roboczym. Zadanie zajmuje go przez 500 milisekund. Chwilę później przychodzi kolejne, które potrzebuje tylko 10 milisekund pracy.

Od zgłoszenia do zakończenia tego drugiego zadania mija około 510 milisekund. Gdybyśmy mierzyli wyłącznie wykonanie, wszystko wyglądałoby na szybkie.

To główna myśl [prezentacji Mateusza Nalepy na Toruń JUG](https://www.youtube.com/watch?v=jG71Hhs0b2w): mierz czas oczekiwania i czas wykonania osobno. Zanim uznasz, że metryka obejmuje całe żądanie, sprawdź, gdzie zaczyna się i kończy pomiar.

## Niskie zużycie CPU nie oznacza wolnych wątków

Wszystkie wątki mogą czekać na blokujące wywołania HTTP, a CPU pozostanie mało obciążone. Nowe zadania nadal muszą czekać na wolny wątek.

Może być też odwrotnie: wątki parsują JSON i intensywnie wykorzystują procesor. W obu przypadkach powstaje kolejka, ale rozwiązanie zależy od tego, czym zajmują się wątki.

Więcej wątków może pomóc przy blokującym I/O, jeśli systemy zależne mają odpowiednią wydajność. Przy pracy obciążającej CPU dodatkowe wątki mogą zwiększyć koszt przełączania bez zwiększenia mocy obliczeniowej. Ten kompromis opisuje [dokumentacja ThreadPoolExecutor](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html).

## Nieblokujące I/O nadal potrzebuje procesora

W przypadku produkcyjnym opisanym w prezentacji migracja zmieniła osobne pule wątków klientów HTTP na jedną wspólną pulę. Przeniesienie parsowania JSON do dedykowanej puli pomogło przywrócić wcześniejsze czasy odpowiedzi.

Nieblokująca komunikacja sieciowa nie sprawia, że parsowanie JSON staje się darmowe. Sprawdź, który wątek wykonuje każdy etap przetwarzania.

Zacznij od pomiaru czasu między zgłoszeniem zadania a początkiem jego wykonania, osobno od czasu wykonania. Na tej podstawie zdecyduj, czy zmienić współbieżność, odizolować rodzaje pracy, czy zoptymalizować samo przetwarzanie.

[Repozytorium autora](https://github.com/mateusz-nalepa/cpu-io-queues-can-be-everywhere) zawiera przykłady monitorowania i izolowania zadań.
