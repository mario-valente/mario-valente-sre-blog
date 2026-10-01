---
title: "SLIs, SLOs e SLAs: o vocabulário que todo SRE precisa dominar"
description: "Entenda a diferença prática entre indicadores, objetivos e acordos de nível de serviço, e como usá-los para orientar decisões de confiabilidade."
pubDate: 2024-01-15
lang: "pt"
tags: ["sre", "observabilidade", "slo"]
translationKey: "slo-fundamentals"
---

Se você trabalha com confiabilidade de sistemas, provavelmente já ouviu os termos **SLI**, **SLO** e **SLA** sendo usados quase como sinônimos. Eles não são. Entender a diferença é o primeiro passo para construir uma cultura de SRE que realmente funcione.

## SLI: o que você mede

Um **Service Level Indicator** é uma métrica quantitativa da experiência do usuário: latência de requisições, taxa de erros, disponibilidade, taxa de acerto de cache. É o dado bruto.

```
SLI = (eventos bem-sucedidos / eventos totais) × 100
```

## SLO: o alvo que você define

O **Service Level Objective** é a meta interna para o seu SLI. Por exemplo: "99.9% das requisições devem responder em menos de 300ms em uma janela de 30 dias".

O SLO é a ferramenta que conecta engenharia e produto: ele define quanto erro é aceitável antes que a confiabilidade vire prioridade sobre novas features.

## SLA: o compromisso externo

O **Service Level Agreement** é um contrato, geralmente com consequências financeiras, firmado com clientes externos. Ele deveria sempre ser **menos rígido** que o seu SLO interno — assim você tem margem para agir antes de violar o acordo.

## Error budget: a matemática da confiabilidade

A partir do SLO nasce o **error budget**: a quantidade de falha tolerável no período. Se o seu SLO é 99.9%, seu orçamento de erro é 0.1% do tempo — e esse orçamento deve orientar decisões como "podemos fazer deploy hoje?" ou "devemos parar features e focar em estabilidade?".

> Um error budget zerado não é motivo de pânico — é um sinal de que a engenharia deve redirecionar esforço para confiabilidade.

Dominar esse vocabulário é a base para qualquer conversa séria sobre reliability engineering.
