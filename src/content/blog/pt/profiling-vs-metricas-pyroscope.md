---
title: "Profiling vs métricas: achando o problema direto no código com Pyroscope"
description: "Métricas avisam que tem algo errado, profiling mostra onde está. Uma introdução a continuous profiling com Grafana Pyroscope e uma POC em Go para você rodar na sua máquina."
pubDate: 2026-10-20
lang: "pt"
tags: ["observabilidade", "profiling", "pyroscope", "grafana", "go", "sre"]
translationKey: "profiling-vs-metricas-pyroscope"
---

Resolvi gravar um vídeo sobre profiling porque eu acho que esse é um dos assuntos mais subestimados dentro de observabilidade. Todo mundo fala de métricas, logs e traces, os famosos três pilares, e o profiling fica ali de canto, como se fosse coisa de quem escreve compilador. Só que ele resolve um problema que todo mundo da nossa área já teve: o gráfico mostra que tem algo errado, mas ninguém sabe o quê.

Este post é a versão escrita do vídeo, com a POC que eu usei para demonstrar.

## O gráfico sobe, e agora?

Vamos a um cenário bem comum. A memória de um serviço começa a subir devagar, até que o pod estoura o limite, leva um OOMKill, reinicia e a curva volta para baixo. Uma semana depois acontece tudo de novo. Alguém olha o dashboard e conclui, com muita sabedoria, que **tem um memory leak**.

Certo. Mas onde?

A métrica não sabe. Ela só te diz a quantidade de memória utilizada em função do tempo, e isso é ótimo para alertar e para descobrir quando o problema começou. Para descobrir *por que*, o que acontece na prática é abrir o código, desconfiar de algumas funções, subir um `pprof` na mão em produção e torcer para o problema ainda estar acontecendo naquele momento. Se ele já passou, azar.

É aqui que entra o profiling. Em vez de um número agregado, você olha **diretamente para o problema no código**: qual função está gastando CPU, qual stack de chamadas alocou a memória que continua viva, onde as goroutines estão paradas. E isso serve para vários tipos de problema:

- um leak de memória, que a métrica mostra como uma curva subindo e o profile mostra como a função que alocou aquilo tudo;
- CPU alta por causa do GC, que na verdade é consequência de alocação demais, e quem está alocando demais aparece no profile de `alloc_space`;
- threads e goroutines acumulando, em que o profile mostra o stack de cada uma e onde estão bloqueadas;
- contenção de lock, que ninguém enxerga em métrica de CPU porque, afinal, quem está esperando não gasta CPU.

Um não substitui o outro, ok? Eu continuo querendo meu alerta baseado em métrica. O profiling é o que eu abro **depois** do alerta, para pular a parte de adivinhação.

## Continuous profiling

O problema do `pprof` manual é que ele é uma foto do momento. Se você não estava olhando na hora certa, perdeu. O **continuous profiling** resolve isso do jeito óbvio: coleta profiles o tempo todo, com um custo baixo, e guarda o histórico. Aí você consulta um profile de ontem às 14h da mesma forma que consulta uma métrica de ontem às 14h.

A ferramenta que eu uso para isso é o [Grafana Pyroscope](https://grafana.com/oss/pyroscope/), um servidor open source de continuous profiling. Ele recebe os profiles, guarda de forma comprimida e conversa com o Grafana, então você olha profiling no mesmo lugar onde já olha suas métricas. Isso parece detalhe, mas faz muita diferença no meio de um incidente.

Existem duas formas de mandar dados para ele. Uma é instrumentar a aplicação com um SDK (é o que eu fiz na POC, com o `pyroscope-go`). A outra é usar o Grafana Alloy, que coleta via eBPF sem você tocar no código. E sobre o overhead: com amostragem de 100 Hz fica algo em torno de 2% a 5% de CPU, o que é tranquilo para rodar em produção.

## A POC

Chega de papinho, vamos ver funcionando. Montei uma POC com uma aplicação em Go, o servidor Pyroscope e o Grafana, tudo subindo com Docker Compose. O código está aqui:

**https://github.com/mario-valente/pyroscope-study**

A aplicação simula um `checkout-service` com três endpoints (`POST /checkout`, `GET /products` e `GET /search`), cada um com um custo diferente. E, de propósito, eu deixei alguns problemas escondidos lá dentro para a gente caçar:

- uma função de CPU pesada, o `computeHash`, que roda `sha256` em loop;
- um `fibonacci` recursivo, só para gerar uma stack bem funda no flamegraph;
- um cache sem eviction (`orderCache`), que guarda pedido para sempre e vaza milhares de objetos pequenos;
- uma goroutine chamada `lockHog` que segura um lock global sem a menor cerimônia, gerando contenção de mutex.

O desenho é simples: a app envia os profiles para o Pyroscope a cada 10 segundos e o Grafana consulta o Pyroscope.

```
┌─────────────┐   push (a cada 10s)   ┌──────────────┐   query    ┌──────────┐
│ app Go      │ ────────────────────► │ Pyroscope    │ ◄───────── │ Grafana  │
│ (poc-app)   │   profiles pprof      │ server :4040 │            │  :3000   │
└─────────────┘                       └──────────────┘            └──────────┘
```

### Como rodar

Você só precisa de Docker com Compose e Go instalados.

```bash
git clone https://github.com/mario-valente/pyroscope-study
cd pyroscope-study

# sobe Pyroscope + Grafana
docker compose up -d

# roda a app, que gera carga e envia os profiles
cd app
go build -o poc-app .
./poc-app
```

Por padrão a app manda os profiles para `http://localhost:4040`. Se o seu servidor estiver em outro lugar, é só definir a variável `PYROSCOPE_SERVER`. Para derrubar tudo depois:

```bash
docker compose down        # com -v apaga os dados também
pkill poc-app
```

Uma observação: o Grafana da POC está com acesso anônimo como Admin. É uma POC local, então tudo bem, mas por favor não leve essa configuração para um ambiente de verdade.

### Onde explorar

Depois de uns minutos com a app rodando, estas são as telas que valem a visita:

- **Dashboard da POC**: http://localhost:3000/d/pyroscope-poc
- **Explore** do Grafana: http://localhost:3000/explore
- **Profiles Drilldown**: http://localhost:3000/a/grafana-pyroscope-app
- **UI do próprio Pyroscope**: http://localhost:4040

Eu começaria pelo dashboard. Ele tem CPU por endpoint, memória alocada e em uso, goroutines, mutex delay e block delay, e ali você tem a visão de métrica: dá para ver que *tem* alguma coisa acontecendo. Dois flamegraphs completam o painel, um de CPU e um de memória.

Depois abra o **Explore**, escolha o datasource Pyroscope, o profile type `process_cpu / cpu` e o serviço `poc.checkout-service`. Você vai ver o flamegraph e, em cima dele, a série temporal. Clique em um frame (o `computeHash`, por exemplo) para dar zoom, e use a busca para destacar uma função. Depois adicione o filtro `endpoint="POST /checkout"` e compare com o `GET /search`. Essas labels existem porque no código eu envolvo cada handler com o `TagWrapper`.

Por fim, o **Profiles Drilldown** tem uma visão de comparação que mostra o diff entre dois períodos. Para investigar regressão depois de um deploy, ela é muito boa.

### O que a app envia

São 10 tipos de profile, que são basicamente todo o pprof do Go: CPU, alocação (bytes e objetos), memória em uso (bytes e objetos), goroutines, mutex (tempo e contagem) e block (tempo e contagem). Os mais úteis para caçar problema:

- `inuse_space` e `inuse_objects` para **memory leak**, porque mostram o que está vivo agora e quem alocou;
- `alloc_space` para **pressão de GC**, porque conta tudo o que foi alocado, mesmo o que já foi coletado;
- `goroutines` para **goroutine leak**;
- `mutex` e `block` para **contenção e latência escondida**.

Um detalhe que pega muita gente em Go: os profiles de mutex e block vêm **desligados por padrão**. Na POC eu ligo os dois logo no começo do `main`:

```go
runtime.SetMutexProfileFraction(5)
runtime.SetBlockProfileRate(5)
```

E instrumentar a aplicação é basicamente isto:

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
        // e os outros que você quiser
    },
})
if err != nil {
    log.Fatalf("erro ao iniciar pyroscope: %v", err)
}
defer profiler.Stop()
```

As `Tags` são labels fixas. Para uma label que muda por trecho de código, como o endpoint, entra o `TagWrapper`:

```go
pyroscope.TagWrapper(ctx, pyroscope.Labels("endpoint", "POST /checkout"), handler)
```

Com isso dá para responder perguntas do tipo "quanto de CPU o endpoint X gasta comparado com o Y?" ou "qual função vaza memória na versão 1.0.0?".

### O que apareceu na POC

Depois de 5 minutos, o flamegraph de CPU me mostrou isto:

```
 92.8%  main.computeHash        <- hotspot evidente
 84.0%  crypto/sha256.Sum256
 34.0%  main.checkoutHandler
 33.5%  main.productsHandler
```

Num gráfico de CPU eu veria "o serviço está gastando muito" e ficaria por aí. No flamegraph não tem muita discussão: 92,8% do tempo está em uma função só.

## Então, qual usar?

Os dois, meus caros. Métrica para saber **que** tem problema e **quando** ele começou, profiling para saber **onde** ele está. Quando os dois ficam no mesmo Grafana, o caminho entre "o gráfico subiu" e "é essa linha aqui" encurta bastante.

Clona a [POC](https://github.com/mario-valente/pyroscope-study), sobe o ambiente e tenta achar o leak do `orderCache` e a contenção do `lockHog` sem olhar o código. Se achar mais alguma coisa estranha lá dentro, pode ser que eu tenha deixado sem querer.
