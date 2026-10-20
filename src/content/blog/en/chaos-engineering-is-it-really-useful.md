---
title: "Is Chaos Engineering Really Useful?"
description: "Some thoughts on chaos, resilience and reliability, plus a practical introduction to LitmusChaos: experiments, probes and the most common fault types."
pubDate: 2026-10-07
lang: "en"
tags: ["chaos-engineering", "sre", "kubernetes", "litmus"]
translationKey: "chaos-engineering-e-mesmo-util"
---

I like this subject a lot, so I decided to bring some thoughts about it here on the blog. And not only that: I decided to take the word **chaos** a little more seriously. In this ocean of news about AI, tools and more tools, new models, new deploys, all of it feels a bit chaotic to me. But that's how it is, our field is chaotic: lots of innovation, people doing silly things or simply writing bad code that, by a miracle of God or a conspiracy of the universe, works in production.

Still, a question remains: where is the resilience in all of this? And I don't mean only resilience, but the reliability of these systems. Some might say: "I have observability, I can see some CPU metrics and I know when my service is degraded". Well, that's a start. Knowing when your application is broken and disappointing a bunch of customers already puts you a few steps ahead of those who don't even know they have customers being impacted. But that's a subject for another article.

The point here is not **if** it's going to happen, but **how I can prepare for when it does**.

## A little chaos theory

One thing I learned from complex systems is that once many components change, or a failure happens in the current operation, behavior can become unpredictable or very complex. Much like chaos theory itself, according to Wikipedia:

> "Small differences in initial conditions, such as those due to errors in measurement or due to rounding errors in numerical computation, can yield widely diverging outcomes for such dynamical systems, rendering long-term prediction of their behavior impossible in general."

In other words, a small change can trigger a chain of events that is impossible to predict. Of course, that is not quite the case when we talk about Chaos Engineering: algorithms are mostly extremely deterministic, and their behavior is easy to predict in the long run. What makes prediction hard is not a mathematical limit, but something that sits between the computer and the chair.

We, mere mortal humans, in our ignorance, think we can build systems armored against our own inability to analyze the countless possible problems. And the truth, my friends, is that I have never met a human being capable of such a feat. In other words, the chance that some failure happens and your beloved system is not prepared for it is almost 100%. To not be so pessimistic: 99.999%.

When we deal with distributed systems and highly complex business rules, problems that are not always under our control are common: an external API with a latency your core application didn't expect, a momentary failure in the database or the messaging broker, a network failure, or even a broken cable that connected the routers between your server and the client. These things can happen all the time, every day. And that's where Chaos Engineering comes in: to define and experiment with what can go wrong and to prepare for the worst-case scenario.

## How I got into this subject

I had the pleasure of coming across this topic a few years ago, when I had to deal with a very critical flow. Critical in the sense that, if it stopped, the whole operation stopped with it, creating a cascading effect so intense that a single outage could lead to the total disaster of other applications. That's when we decided to run experiments using the Chaos Engineering methodology.

Over time, I started finding mentions of this kind of experiment in well-known books and understanding its importance better. A few examples:

### 1. Site Reliability Engineering: How Google Runs Production Systems

**Chapter 4: Service Level Objectives**

Here there is an interesting connection with *failure injection*. The book explains that failure injection has a different purpose from simply defining SLOs: it serves to verify whether the expectations about the system's behavior actually match reality, besides helping to identify known points of failure that can be exploited.

**Chapter 28: Accelerating SREs to On-Call and Beyond**

This one has less to do with Chaos Engineering directly, but it shows one of its essential foundations. Google describes the **Wheel of Misfortune**, an exercise in which engineers simulate real incidents and practice the response. The goal is to build familiarity with situations that would be hard to reproduce outside a real incident.

**The mention of Chaos Monkey**

The book also includes, in its bibliography, the 2012 article *"Chaos Monkey Released Into The Wild"*. And later Google SRE materials explicitly recommend *destructive testing*, citing Netflix's Chaos Monkey as an example.

### 2. The Phoenix Project

Here things get even more explicit. After the Unicorn Project team matures, **Project Narwhal** appears, described as an implementation of the Simian Army / Chaos Monkey. The team starts creating failures deliberately to cause outages and discover weak points.

The goal is not to cause damage. And that is very important to understand.

## The most important point: chaos is not about breaking everything

If there is one thing I want you to take away from this article, it's this: **Chaos Engineering is about testing something for which you have already built a prevention.**

I'm not just going to cut the database connection "to see what happens". Of course, if you don't have a fallback, everything will break. That's not an experiment, it's a self-inflicted incident.

The right way is the opposite:

1. **I know a risk**: "the database can be unavailable for a few seconds".
2. **I implement a prevention**: retry with backoff, circuit breaker, read replica, a queue to process later, cache, graceful degradation...
3. **I formulate a hypothesis**: "if the database goes down for 30 seconds, the API keeps responding with cached data and the error rate stays below 1%".
4. **I inject the failure in a controlled way** and measure whether the hypothesis holds.
5. **I learn**: either the prevention worked (great, now you have evidence instead of faith), or it failed, and you found out in a controlled experiment, not at 3 a.m. with the customer calling.

The "normal" state you expect to maintain during the failure has a name: **steady state**. Every good experiment starts by defining what the steady state is and how to measure it. And yes, this is where that observability I mentioned above stops being optional.

Another golden rule: start small. Control the **blast radius**, run first in a test environment, then on a small part of production, and always have a way to abort the experiment.

There are plenty of articles and materials on the subject, not only presenting its effectiveness but showing that it is part of the maturity of any SRE team.

## Enough chatter: LitmusChaos

All right, we already know why it matters, but enough chatter. A good way to show this methodology working is to explain a tool capable of running experiments. The one I had the most contact with is [LitmusChaos](https://litmuschaos.io), an open source project at the **Incubating** stage in the CNCF.

The idea is to make this kind of experiment easy in Kubernetes environments, and not only that: it records every execution and lets you run experiments continuously and on a schedule, as part of the routine and not as an isolated event.

In short, Litmus has:

- **ChaosCenter**: the portal (UI + API) where you create, schedule and follow experiments.
- **ChaosHub**: a catalog of ready-to-use faults, which you can also extend with your own.
- **Chaos Infrastructure**: the agents installed on the target cluster, which actually execute the failures.

To get started, it helps to understand a few concepts.

### What is an experiment?

In Litmus, a **Chaos Experiment** is the unit you create and run: it describes **which failure to inject, on which target, for how long, and how to validate whether the system behaved as expected**. An experiment can contain one or more faults, running in sequence or in parallel.

Under the hood, a few Kubernetes resources (CRDs) make this happen:

- **ChaosExperiment**: the definition of the fault itself (e.g. what a `pod-delete` is and how to run it).
- **ChaosEngine**: the "glue" between the fault and your application. It says which workload is the target, the parameters (duration, interval, percentage of affected pods) and which probes to validate.
- **ChaosResult**: the result of the execution, with the verdict (`Pass`/`Fail`) and the status of the probes.

At the end, Litmus calculates a **Resilience Score**, a grade that indicates how healthy the system stayed during the experiment. By running this continuously, you start tracking how resilience evolves over time, and not just a snapshot of a single day.

### What is a probe?

Remember the hypothesis and the steady state? The **probe** is exactly how you validate that automatically. It is a pluggable check that runs alongside the experiment and decides whether it passed or failed. Without a probe, you only know that you broke something; with a probe, you know whether your prevention worked.

Litmus has four types of probe:

- **httpProbe**: makes an HTTP request (GET/POST) to a URL and compares the status code. E.g.: "does the `/health` endpoint keep returning 200?".
- **cmdProbe**: runs a shell command and compares the output. Great for specific checks: querying a value in the database, searching for a string in the logs, validating a JSON.
- **k8sProbe**: performs operations on Kubernetes resources. E.g.: "are the deployment's pods still `Running`?".
- **promProbe**: runs a PromQL query on Prometheus and compares the value. E.g.: "did the 5xx error rate stay below 1%?" or "did p99 latency stay below 500ms?".

And each probe can run in a different **mode**:

- **SOT** (*Start of Test*): before the failure, to make sure the system was healthy before starting.
- **EOT** (*End of Test*): after the failure, to make sure the system recovered.
- **Edge**: before and after.
- **Continuous**: during the whole experiment, at defined intervals.
- **OnChaos**: continuously, but only while the failure is being injected.

An example of a `ChaosEngine` that kills the pods of an API and validates, throughout the chaos, that the health check keeps responding:

```yaml
apiVersion: litmuschaos.io/v1alpha1
kind: ChaosEngine
metadata:
  name: checkout-api-chaos
  namespace: checkout
spec:
  engineState: active
  appinfo:
    appns: checkout
    applabel: app=checkout-api
    appkind: deployment
  chaosServiceAccount: pod-delete-sa
  experiments:
    - name: pod-delete
      spec:
        components:
          env:
            - name: TOTAL_CHAOS_DURATION
              value: "60"
            - name: CHAOS_INTERVAL
              value: "10"
            - name: PODS_AFFECTED_PERC
              value: "50"
        probe:
          - name: checkout-health
            type: httpProbe
            mode: Continuous
            httpProbe/inputs:
              url: http://checkout-api.checkout.svc:8080/health
              method:
                get:
                  criteria: ==
                  responseCode: "200"
            runProperties:
              probeTimeout: 5s
              interval: 5s
              retry: 1
              probePollingInterval: 2s
```

Notice the main point: the prevention here is multiple replicas, the `PodDisruptionBudget` and a well-configured readiness probe. The experiment exists to **prove** that this prevention works. If your application runs with a single replica, you already know the result, and you don't need Chaos Engineering for that.

### What are the fault types?

The **fault** is the failure that will be injected. The ChaosHub has dozens of them, but the most common ones in day-to-day work fall into a few categories:

**Pod / container**

- `pod-delete`: kills pods at random. The classic, a direct heir of Chaos Monkey. Validates replicas, PDB and recovery time.
- `container-kill`: kills a specific container inside the pod.
- `pod-autoscaler`: tests whether the cluster can scale the replicas when needed.

**Resources (stress)**

- `pod-cpu-hog` / `pod-memory-hog`: consume CPU or memory in the pod. Great for validating limits, HPA and behavior under pressure (and discovering that hidden OOMKill).
- `pod-io-stress` / `disk-fill`: stress or fill the disk.

**Network**

- `pod-network-latency`: adds latency. Perfect for simulating that slow external API and validating your timeouts.
- `pod-network-loss`: packet loss.
- `pod-network-partition`: isolates the pod from the network. This is where you test that database fallback in a controlled way.
- `pod-network-corruption` / `pod-network-duplication`: corrupted or duplicated packets.
- `pod-dns-error` / `pod-dns-spoof`: DNS resolution failures (the famous "it's always DNS").

**HTTP (application layer)**

- `pod-http-latency`, `pod-http-status-code`, `pod-http-modify-body`: change the HTTP responses of a service, simulating a dependency that responds slowly or with a 500 error.

**Node**

- `node-drain`: drains a node, simulating maintenance or the loss of a machine.
- `node-cpu-hog` / `node-memory-hog`: stress the entire node.
- `kubelet-service-kill` / `node-restart`: failures in the node's infrastructure.

**Cloud**

- Provider-specific faults, such as `ec2-terminate-by-id`, `ebs-loss`, and equivalents for GCP and Azure, for when the failure is not in the cluster but in the cloud underneath it.

## So, is Chaos Engineering really useful?

Yes. But not in the way many people imagine. It is not about breaking production to watch the circus catch fire. It is about turning "I think my system can handle it" into "I **know** my system can handle it, because I tested it".

Every prevention that has never been tested is just a hypothesis. A fallback that never ran, a retry that never fired, a replica that never took over... all of it works perfectly, until the day you actually need it.

Chaos is already here, every day. The difference is whether you will meet it in a controlled experiment or in an incident at 3 a.m.
