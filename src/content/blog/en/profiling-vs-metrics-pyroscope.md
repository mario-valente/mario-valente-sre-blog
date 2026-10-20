---
title: "Profiling vs Metrics: Finding the Problem Straight in the Code with Pyroscope"
description: "Metrics tell you something is wrong, profiling shows you where. An introduction to continuous profiling with Grafana Pyroscope and a Go POC you can run on your own machine."
pubDate: 2026-10-20
lang: "en"
tags: ["observability", "profiling", "pyroscope", "grafana", "go", "sre"]
translationKey: "profiling-vs-metricas-pyroscope"
---

I decided to record a video about profiling because I think it is one of the most underrated subjects in observability. Everybody talks about metrics, logs and traces, the famous three pillars, and profiling sits off in a corner, as if it were something for people who write compilers. But it solves a problem everyone in our field has had: the graph shows something is wrong, but nobody knows what.

This post is the written version of the video, along with the POC I used for the demo.

## The graph goes up, now what?

Let's take a very common scenario. A service's memory starts climbing slowly, until the pod blows past its limit, gets OOMKilled, restarts, and the curve drops back down. A week later it all happens again. Someone looks at the dashboard and concludes, with great wisdom, that **there is a memory leak**.

Right. But where?

The metric doesn't know. It only tells you the amount of memory in use as a function of time, which is great for alerting and for finding out when the problem started. To find out *why*, what happens in practice is opening the code, suspecting a few functions, attaching `pprof` by hand in production and hoping the problem is still happening at that moment. If it's already gone, bad luck.

This is where profiling comes in. Instead of an aggregated number, you look **straight at the problem in the code**: which function is burning CPU, which call stack allocated the memory that is still alive, where the goroutines are stuck. And this works for several kinds of problem:

- a memory leak, which the metric shows as a rising curve and the profile shows as the function that allocated all of that;
- high CPU because of the GC, which is really a consequence of too many allocations, and whoever is allocating too much shows up in the `alloc_space` profile;
- threads and goroutines piling up, where the profile shows each one's stack and where they are blocked;
- lock contention, which nobody sees in a CPU metric because, after all, whoever is waiting is not using CPU.

One doesn't replace the other, ok? I still want my metric-based alert. Profiling is what I open **after** the alert, to skip the guessing part.

## Continuous profiling

The problem with manual `pprof` is that it is a snapshot of the moment. If you weren't looking at the right time, you missed it. **Continuous profiling** solves this the obvious way: it collects profiles all the time, at low cost, and keeps the history. Then you query a profile from yesterday at 2 p.m. the same way you query a metric from yesterday at 2 p.m.

The tool I use for this is [Grafana Pyroscope](https://grafana.com/oss/pyroscope/), an open source continuous profiling server. It receives the profiles, stores them compressed and talks to Grafana, so you look at profiling in the same place where you already look at your metrics. That seems like a detail, but it makes a big difference in the middle of an incident.

There are two ways to send data to it. One is to instrument the application with an SDK (that's what I did in the POC, with `pyroscope-go`). The other is to use Grafana Alloy, which collects through eBPF without you touching the code. As for overhead: with 100 Hz sampling it sits around 2% to 5% of CPU, which is fine for running in production.

## The POC

Enough chatter, let's see it working. I put together a POC with a Go application, the Pyroscope server and Grafana, all coming up with Docker Compose. The code is here:

**https://github.com/mario-valente/pyroscope-study**

The application simulates a `checkout-service` with three endpoints (`POST /checkout`, `GET /products` and `GET /search`), each with a different cost. And, on purpose, I left a few problems hidden inside for us to hunt down:

- a CPU-heavy function, `computeHash`, which runs `sha256` in a loop;
- a recursive `fibonacci`, just to generate a really deep stack in the flamegraph;
- a cache with no eviction (`orderCache`), which keeps orders forever and leaks thousands of small objects;
- a goroutine called `lockHog` that holds a global lock without the slightest ceremony, causing mutex contention.

The design is simple: the app sends profiles to Pyroscope every 10 seconds and Grafana queries Pyroscope.

```
┌─────────────┐   push (every 10s)    ┌──────────────┐   query    ┌──────────┐
│ Go app      │ ────────────────────► │ Pyroscope    │ ◄───────── │ Grafana  │
│ (poc-app)   │   pprof profiles      │ server :4040 │            │  :3000   │
└─────────────┘                       └──────────────┘            └──────────┘
```

### How to run it

You only need Docker with Compose and Go installed.

```bash
git clone https://github.com/mario-valente/pyroscope-study
cd pyroscope-study

# brings up Pyroscope + Grafana
docker compose up -d

# runs the app, which generates load and sends the profiles
cd app
go build -o poc-app .
./poc-app
```

By default the app sends profiles to `http://localhost:4040`. If your server is somewhere else, just set the `PYROSCOPE_SERVER` variable. To tear everything down afterwards:

```bash
docker compose down        # with -v it wipes the data too
pkill poc-app
```

One note: the POC's Grafana has anonymous access as Admin. It's a local POC, so that's fine, but please don't take that configuration to a real environment.

### Where to explore

After a few minutes with the app running, these are the screens worth visiting:

- **POC dashboard**: http://localhost:3000/d/pyroscope-poc
- Grafana **Explore**: http://localhost:3000/explore
- **Profiles Drilldown**: http://localhost:3000/a/grafana-pyroscope-app
- **Pyroscope's own UI**: http://localhost:4040

I would start with the dashboard. It has CPU per endpoint, allocated and in-use memory, goroutines, mutex delay and block delay, and there you get the metrics view: you can see that *something* is going on. Two flamegraphs complete the panel, one for CPU and one for memory.

Then open **Explore**, choose the Pyroscope datasource, the `process_cpu / cpu` profile type and the `poc.checkout-service` service. You will see the flamegraph and, above it, the time series. Click a frame (`computeHash`, for example) to zoom in, and use the search to highlight a function. Then add the filter `endpoint="POST /checkout"` and compare it with `GET /search`. Those labels exist because in the code I wrap every handler with `TagWrapper`.

Finally, **Profiles Drilldown** has a comparison view that shows the diff between two periods. For investigating a regression after a deploy, it is very good.

### What the app sends

There are 10 profile types, which is basically all of Go's pprof: CPU, allocation (bytes and objects), in-use memory (bytes and objects), goroutines, mutex (time and count) and block (time and count). The most useful ones for hunting problems:

- `inuse_space` and `inuse_objects` for **memory leaks**, because they show what is alive right now and who allocated it;
- `alloc_space` for **GC pressure**, because it counts everything that was allocated, even what has already been collected;
- `goroutines` for **goroutine leaks**;
- `mutex` and `block` for **contention and hidden latency**.

One detail that catches a lot of people in Go: the mutex and block profiles are **off by default**. In the POC I turn both on right at the start of `main`:

```go
runtime.SetMutexProfileFraction(5)
runtime.SetBlockProfileRate(5)
```

And instrumenting the application is basically this:

```go
profiler, err := pyroscope.Start(pyroscope.Config{
    ApplicationName: "poc.checkout-service",
    ServerAddress:   "http://localhost:4040",
    Tags: map[string]string{
        "region":      "sa-east-1",
        "environment": "poc",
        "version":     "1.0.0",
    },
    ProfileTypes: []pyroscope.ProfileType{
        pyroscope.ProfileCPU,
        pyroscope.ProfileAllocSpace,
        pyroscope.ProfileInuseSpace,
        pyroscope.ProfileGoroutines,
        // and any others you want
    },
})
if err != nil {
    log.Fatalf("failed to start pyroscope: %v", err)
}
defer profiler.Stop()
```

The `Tags` are fixed labels. For a label that changes per piece of code, like the endpoint, `TagWrapper` comes in:

```go
pyroscope.TagWrapper(ctx, pyroscope.Labels("endpoint", "POST /checkout"), handler)
```

With that you can answer questions like "how much CPU does endpoint X use compared to Y?" or "which function leaks memory in version 1.0.0?".

### What showed up in the POC

After 5 minutes, the CPU flamegraph showed me this:

```
 92.8%  main.computeHash        <- obvious hotspot
 84.0%  crypto/sha256.Sum256
 34.0%  main.checkoutHandler
 33.5%  main.productsHandler
```

On a CPU graph I would see "the service is using a lot" and leave it at that. On the flamegraph there is not much to argue about: 92.8% of the time is in a single function.

## So, which one should you use?

Both, my friends. Metrics to know **that** there is a problem and **when** it started, profiling to know **where** it is. When both live in the same Grafana, the path between "the graph went up" and "it's this line right here" gets a lot shorter.

Clone the [POC](https://github.com/mario-valente/pyroscope-study), bring the environment up and try to find the `orderCache` leak and the `lockHog` contention without looking at the code. If you find anything else strange in there, maybe I left it by accident.
