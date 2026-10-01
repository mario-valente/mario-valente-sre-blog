---
title: "Observabilidade não é só dashboard bonito: logs, métricas e traces na prática"
description: "Os três pilares da observabilidade explicados com exemplos reais de troubleshooting em produção."
pubDate: 2024-02-10
lang: "pt"
tags: ["observabilidade", "sre", "kubernetes"]
translationKey: "three-pillars-observability"
---

Observabilidade virou buzzword, mas o conceito por trás dela resolve um problema muito concreto: **entender o estado interno de um sistema a partir de sinais externos**, sem precisar adivinhar.

## Métricas: a visão agregada

Métricas são números ao longo do tempo — CPU, latência p99, taxa de requisições por segundo. Elas são baratas de armazenar e ótimas para alertas e dashboards, mas não contam a história completa de uma requisição individual.

## Logs: o detalhe granular

Logs estruturados (JSON, com `trace_id` e `span_id`) permitem reconstruir exatamente o que aconteceu em uma requisição específica. O erro está nos logs; a tendência está nas métricas.

## Traces: a jornada distribuída

Em arquiteturas de microsserviços, uma requisição pode atravessar dezenas de serviços. O **distributed tracing** (OpenTelemetry, Jaeger, Tempo) mostra o caminho completo e onde está o gargalo.

```
Request → API Gateway → Auth Service → Order Service → Payment Service
             (12ms)         (8ms)          (340ms) ←── aqui está o problema
```

## Juntando as peças

O verdadeiro poder da observabilidade aparece quando você consegue **correlacionar** os três pilares: uma métrica de latência alta leva você aos traces daquele período, e os traces levam aos logs exatos daquela requisição lenta.

> Ferramentas como Grafana, Prometheus, Loki e Tempo (a stack "LGTM") foram desenhadas justamente para essa correlação.

Investir em observabilidade não é sobre ter dashboards bonitos — é sobre reduzir o **MTTR** (tempo médio de recuperação) quando as coisas derem errado, e elas vão dar.
