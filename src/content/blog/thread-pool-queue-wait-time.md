---
title: "Your code is fast. Your tasks are waiting."
description: "Thread pool queues can slow down an application even when CPU usage looks healthy. Measure waiting time to see what execution metrics miss."
pubDate: "Nov 20 2026"
tags: ["Java", "Performance", "Concurrency"]
---

Your application gets slower as traffic grows. CPU usage looks fine, and the business logic seems fast. So where is the time going?

One place to check is the queue in front of your thread pool. A task can spend longer waiting for a thread than actually running.

## Execution time is only part of the story

Imagine a pool with one worker. A task occupies it for 500 milliseconds. Another task arrives just afterwards and needs only 10 milliseconds to execute.

That second task still takes roughly 510 milliseconds from submission to completion. Measuring only its execution would make everything look fast.

This is the central idea in [Mateusz Nalepa's talk at Toruń JUG](https://www.youtube.com/watch?v=jG71Hhs0b2w): measure queue waiting and execution separately. Check where your existing timers start and stop before assuming they cover the whole request.

## Low CPU does not mean spare workers

All workers can be occupied waiting for blocking HTTP calls while CPU usage stays low. New tasks still have to wait for a worker.

The opposite can happen too: workers are busy parsing JSON and consuming CPU. There is a queue in both cases, but the useful fix depends on what occupies the threads.

Adding threads can help with blocking I/O when downstream capacity allows it. For CPU-heavy work, more threads can add scheduling overhead without creating more processing capacity. Java's [ThreadPoolExecutor documentation](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html) explains this tradeoff.

## Nonblocking I/O still needs CPU

In the production case described in the talk, a migration changed HTTP clients from separate thread pools to a shared pool. Moving JSON parsing onto a dedicated pool helped restore response times.

The useful detail: nonblocking networking does not make JSON parsing free. Check which thread actually runs each stage of your pipeline.

Start by measuring the interval between task submission and the beginning of execution, separately from execution duration. Then use that evidence to decide whether to adjust concurrency, isolate workloads, or optimize the work itself.

The speaker's [example repository](https://github.com/mateusz-nalepa/cpu-io-queues-can-be-everywhere) includes monitoring examples and demonstrations of workload isolation.
