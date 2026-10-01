---
title: "SLIs, SLOs, and SLAs: the vocabulary every SRE needs"
description: "Understand the practical difference between indicators, objectives, and service agreements, and how to use them to drive reliability decisions."
pubDate: 2024-01-15
lang: "en"
tags: ["sre", "observability", "slo"]
translationKey: "slo-fundamentals"
---

If you work on system reliability, you've probably heard **SLI**, **SLO**, and **SLA** used almost interchangeably. They aren't the same thing, and understanding the difference is the first step toward a reliability culture that actually works.

## SLI: what you measure

A **Service Level Indicator** is a quantitative measurement of user experience: request latency, error rate, availability, cache hit ratio. It's the raw signal.

```
SLI = (successful events / total events) × 100
```

## SLO: the target you set

A **Service Level Objective** is the internal goal for your SLI. For example: "99.9% of requests must respond in under 300ms over a rolling 30-day window."

The SLO is the bridge between engineering and product: it defines how much failure is acceptable before reliability takes priority over new features.

## SLA: the external commitment

A **Service Level Agreement** is a contract, usually with financial consequences, made with external customers. It should always be **looser** than your internal SLO, so you have room to act before actually breaching the agreement.

## Error budgets: the math of reliability

From the SLO comes the **error budget**: the amount of tolerable failure for the period. If your SLO is 99.9%, your error budget is 0.1% of the time — and that budget should drive decisions like "can we ship today?" or "should we freeze features and focus on stability?"

> A depleted error budget isn't a reason to panic — it's a signal that engineering should redirect effort toward reliability.

Mastering this vocabulary is the foundation for any serious conversation about reliability engineering.
