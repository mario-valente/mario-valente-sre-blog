---
title: "Observability isn't just pretty dashboards: logs, metrics, and traces in practice"
description: "The three pillars of observability explained through real production troubleshooting examples."
pubDate: 2024-02-10
lang: "en"
tags: ["observability", "sre", "kubernetes"]
translationKey: "three-pillars-observability"
---

Observability has become a buzzword, but the concept behind it solves a very concrete problem: **understanding a system's internal state from its external signals**, without guessing.

## Metrics: the aggregate view

Metrics are numbers over time — CPU, p99 latency, requests per second. They're cheap to store and great for alerting and dashboards, but they don't tell the full story of a single request.

## Logs: the granular detail

Structured logs (JSON, with `trace_id` and `span_id`) let you reconstruct exactly what happened in a specific request. The error lives in the logs; the trend lives in the metrics.

## Traces: the distributed journey

In microservice architectures, a single request can cross dozens of services. **Distributed tracing** (OpenTelemetry, Jaeger, Tempo) shows the full path and pinpoints the bottleneck.

```
Request → API Gateway → Auth Service → Order Service → Payment Service
             (12ms)         (8ms)          (340ms) ←── here's the problem
```

## Putting it all together

The real power of observability shows up when you can **correlate** all three pillars: a high-latency metric takes you to the traces from that time window, and the traces take you to the exact logs for that slow request.

> Tools like Grafana, Prometheus, Loki, and Tempo (the "LGTM" stack) were built exactly for this kind of correlation.

Investing in observability isn't about having pretty dashboards — it's about reducing **MTTR** (mean time to recovery) when things go wrong. And they will.
