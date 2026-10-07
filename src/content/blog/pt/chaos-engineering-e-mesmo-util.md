---
title: "Chaos Engineering é mesmo útil?"
description: "Alguns pensamentos sobre caos, resiliência e confiabilidade, e uma introdução prática ao LitmusChaos: experimentos, probes e os tipos de fault mais comuns."
pubDate: 2026-10-07
lang: "pt"
tags: ["chaos-engineering", "sre", "kubernetes", "litmus"]
---

Como eu gosto muito desse assunto, resolvi trazer alguns pensamentos sobre ele aqui no blog. E não só isso: resolvi levar um pouco mais a sério essa palavra, **caos**. Nessa imensidão de notícias sobre AI, ferramentas e mais ferramentas, modelos novos, deploys novos, tudo isso me parece meio caótico. Mas é assim mesmo, a nossa área é caótica: muita inovação, pessoas fazendo besteira ou simplesmente criando código ruim que, por um milagre de Deus ou uma conspiração do universo, funciona em produção.

Só que fica uma dúvida: onde fica a resiliência nisso tudo? E não digo só resiliência, mas a confiabilidade desses sistemas. Alguns podem dizer: "tenho observabilidade aqui, consigo ver algumas métricas de CPU e sei quando meu serviço está degradado". Bom, isso é um começo. Saber quando sua aplicação está quebrada e decepcionando vários clientes já te coloca alguns passos à frente de quem nem sabe que tem clientes sendo impactados. Mas isso é assunto para outro artigo.

A questão aqui não é **se** vai acontecer, e sim **como eu posso me preparar para quando acontecer**.

## Um pouco de teoria do caos

Um fato que aprendi com sistemas complexos é que, a partir do momento em que muitos componentes sofrem qualquer alteração, ou acontece uma falha na operação vigente, os comportamentos podem se tornar imprevisíveis ou muito complexos. Muito parecido com a própria teoria do caos, segundo a Wikipédia:

> "Pequenas diferenças nas condições iniciais, tais como as causadas por erros de arredondamento em computação numérica, produzem resultados amplamente divergentes para tais sistemas dinâmicos, tornando a previsão a longo prazo impossível."

Em outras palavras, uma mudança pequena pode desencadear uma série de eventos impossíveis de prever. Logicamente, não é bem esse o caso quando falamos de Chaos Engineering: algoritmos são, em sua maioria, extremamente determinísticos e têm comportamento fácil de prever a longo prazo. O que dificulta a previsão não é um limite matemático, mas algo que fica entre o computador e a cadeira.

Nós, meros humanos mortais, em nossa ignorância, achamos que podemos criar sistemas blindados contra a nossa própria incapacidade de analisar todas as incontáveis possibilidades de problema. E a verdade, meus caros, é que eu nunca encontrei o ser humano capaz de tal feito. Ou seja, a chance de alguma falha acontecer e o seu querido sistema não estar preparado para ela é de quase 100%. Para não ser tão pessimista: 99,999%.

Quando lidamos com sistemas distribuídos e regras de negócio altamente complexas, é comum acontecerem problemas que nem sempre estão sob o nosso controle: uma API externa com uma latência que a sua aplicação core não esperava, uma falha momentânea no banco de dados ou no broker de mensageria, uma falha de rede, ou até um cabo rompido que ligava os roteadores entre o seu servidor e o cliente. Essas coisas podem acontecer o tempo todo, todos os dias. E é aí que o Chaos Engineering entra: para definir e experimentar o que pode dar errado e se preparar para o pior cenário.

## Como eu cheguei nesse assunto

Tive o prazer de ter contato com esse tema há alguns anos, quando precisei lidar com um fluxo muito crítico. Crítico no sentido de que, se ele parasse, toda a operação parava junto, criando um efeito cascata tão intenso que uma única parada poderia levar ao desastre total de outras aplicações. Foi aí que resolvemos fazer experimentos usando a metodologia de Chaos Engineering.

Com o tempo, fui resgatando menções a esse tipo de experimento em livros bem conhecidos e entendendo melhor a sua importância. Alguns exemplos:

### 1. Site Reliability Engineering: How Google Runs Production Systems

**Capítulo 4 — Service Level Objectives**

Aqui aparece uma conexão interessante com *failure injection*. O livro explica que a injeção de falhas tem uma finalidade diferente de simplesmente definir SLOs: ela serve para verificar se as expectativas sobre o comportamento do sistema realmente correspondem à realidade, além de ajudar a identificar pontos de falha conhecidos que podem ser explorados.

**Capítulo 28 — Accelerating SREs to On-Call and Beyond**

Esse não tem tanto a ver com Chaos Engineering diretamente, mas mostra um dos seus fundamentos essenciais. O Google descreve o **Wheel of Misfortune**, um exercício em que engenheiros simulam incidentes reais e praticam a resposta. O objetivo é criar familiaridade com situações que seriam difíceis de reproduzir fora de um incidente de verdade.

**A menção ao Chaos Monkey**

O livro também inclui, na bibliografia, o artigo *"Chaos Monkey Released Into The Wild"*, de 2012. E em materiais posteriores do Google SRE aparece explicitamente a recomendação de *destructive testing*, citando o Chaos Monkey da Netflix como exemplo.

### 2. The Phoenix Project

Aqui a coisa fica ainda mais explícita. Depois que o time do Projeto Unicorn amadurece, surge o **Project Narwhal**, descrito como uma implementação do Simian Army / Chaos Monkey. A equipe passa a criar falhas deliberadamente para provocar outages e descobrir pontos fracos.

O objetivo não é causar dano. E isso é muito importante de entender.

## O ponto mais importante: caos não é sair quebrando tudo

Se tem uma coisa que eu quero que você leve deste artigo, é esta: **Chaos Engineering é sobre testar algo para o qual você já criou uma prevenção.**

Eu não vou simplesmente derrubar a conexão com o banco de dados para "ver o que acontece". É claro que, se você não tiver um fallback, vai quebrar tudo. Isso não é experimento, é incidente autoinfligido.

O caminho certo é o inverso:

1. **Eu conheço um risco**: "o banco pode ficar indisponível por alguns segundos".
2. **Eu implemento uma prevenção**: retry com backoff, circuit breaker, réplica de leitura, fila para processar depois, cache, degradação graciosa...
3. **Eu formulo uma hipótese**: "se o banco cair por 30 segundos, a API continua respondendo com dados em cache e a taxa de erro fica abaixo de 1%".
4. **Eu injeto a falha de forma controlada** e meço se a hipótese se sustenta.
5. **Eu aprendo**: ou a prevenção funcionou (ótimo, agora você tem evidência e não fé), ou ela falhou, e você descobriu isso num experimento controlado, não às 3h da manhã com o cliente ligando.

Esse estado "normal" que você espera manter durante a falha tem nome: **steady state** (estado estável). Todo bom experimento começa definindo qual é o steady state e como medi-lo. E sim, é aqui que aquela observabilidade de que falei lá em cima deixa de ser opcional.

Outra regra de ouro: comece pequeno. Controle o **raio de impacto** (*blast radius*), rode primeiro em um ambiente de testes, depois em uma pequena parte da produção, e sempre tenha um jeito de abortar o experimento.

Existem diversos artigos e materiais sobre o tema, não só apresentando sua eficácia, mas mostrando que ele faz parte do amadurecimento de qualquer equipe de SRE.

## Chega de papinho: LitmusChaos

Tudo bem, já sabemos da importância, mas chega de papinho. Uma boa forma de mostrar essa metodologia funcionando é explicar uma ferramenta capaz de executar experimentos. A que eu tive mais contato foi o [LitmusChaos](https://litmuschaos.io), um projeto open source em estágio **Incubating** na CNCF.

A ideia dele é facilitar esse tipo de experimento em ambientes Kubernetes, e não só isso: ele registra todas as execuções e permite rodar os experimentos de forma contínua e agendada, como parte da rotina e não como um evento isolado.

De forma resumida, o Litmus tem:

- **ChaosCenter**: o portal (UI + API) onde você cria, agenda e acompanha os experimentos.
- **ChaosHub**: um catálogo de faults prontos para uso, que você também pode estender com os seus.
- **Chaos Infrastructure**: os agentes instalados no cluster alvo, que de fato executam as falhas.

Para começar, é bom entender alguns conceitos.

### O que é um experimento?

No Litmus, um **Chaos Experiment** é a unidade que você cria e executa: ele descreve **qual falha injetar, em qual alvo, por quanto tempo e como validar se o sistema se comportou como esperado**. Um experimento pode conter um ou mais faults, rodando em sequência ou em paralelo.

Por baixo dos panos, alguns recursos do Kubernetes (CRDs) fazem isso acontecer:

- **ChaosExperiment**: a definição do fault em si (ex.: o que é um `pod-delete` e como executá-lo).
- **ChaosEngine**: a "cola" entre o fault e a sua aplicação. Diz qual workload será alvo, os parâmetros (duração, intervalo, porcentagem de pods afetados) e quais probes validar.
- **ChaosResult**: o resultado da execução, com o veredito (`Pass`/`Fail`) e o status das probes.

Ao final, o Litmus calcula um **Resilience Score**, uma nota que indica o quanto o sistema se manteve saudável durante o experimento. Rodando isso de forma contínua, você passa a acompanhar a evolução da resiliência ao longo do tempo, e não só uma foto de um único dia.

### O que é uma probe?

Lembra da hipótese e do steady state? A **probe** é exatamente como você valida isso de forma automática. Ela é uma checagem plugável que roda junto com o experimento e define se ele passou ou falhou. Sem probe, você só sabe que quebrou algo; com probe, você sabe se a sua prevenção funcionou.

O Litmus tem quatro tipos de probe:

- **httpProbe**: faz uma requisição HTTP (GET/POST) para uma URL e compara o status code. Ex.: "o endpoint `/health` continua retornando 200?".
- **cmdProbe**: executa um comando shell e compara a saída. Ótimo para checagens específicas: consultar um dado no banco, procurar uma string nos logs, validar um JSON.
- **k8sProbe**: faz operações em recursos do Kubernetes. Ex.: "os pods do deployment continuam `Running`?".
- **promProbe**: executa uma query PromQL no Prometheus e compara o valor. Ex.: "a taxa de erro 5xx ficou abaixo de 1%?" ou "o p99 de latência ficou abaixo de 500ms?".

E cada probe pode rodar em um **modo** diferente:

- **SOT** (*Start of Test*): antes da falha, para garantir que o sistema estava saudável antes de começar.
- **EOT** (*End of Test*): depois da falha, para garantir que o sistema se recuperou.
- **Edge**: antes e depois.
- **Continuous**: durante todo o experimento, em intervalos definidos.
- **OnChaos**: continuamente, mas apenas durante a injeção da falha.

Um exemplo de `ChaosEngine` que mata pods de uma API e valida, durante todo o caos, que o health check continua respondendo:

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

Repare no ponto principal: a prevenção aqui são as múltiplas réplicas, o `PodDisruptionBudget` e o readiness probe bem configurado. O experimento existe para **provar** que essa prevenção funciona. Se a sua aplicação roda com uma réplica só, você já sabe o resultado, e não precisa de Chaos Engineering pra isso.

### Quais são os tipos de fault?

O **fault** é a falha que será injetada. O ChaosHub tem dezenas deles, mas os mais comuns no dia a dia se dividem em algumas categorias:

**Pod / container**

- `pod-delete`: mata pods aleatoriamente. O clássico, herdeiro direto do Chaos Monkey. Valida réplicas, PDB e tempo de recuperação.
- `container-kill`: mata um container específico dentro do pod.
- `pod-autoscaler`: testa se o cluster consegue escalar as réplicas quando necessário.

**Recursos (stress)**

- `pod-cpu-hog` / `pod-memory-hog`: consomem CPU ou memória do pod. Ótimo para validar limits, HPA e o comportamento sob pressão (e descobrir aquele OOMKill escondido).
- `pod-io-stress` / `disk-fill`: estressam ou enchem o disco.

**Rede**

- `pod-network-latency`: adiciona latência. Perfeito para simular aquela API externa lenta e validar seus timeouts.
- `pod-network-loss`: perda de pacotes.
- `pod-network-partition`: isola o pod da rede. É aqui que você testa aquele fallback do banco de dados de forma controlada.
- `pod-network-corruption` / `pod-network-duplication`: pacotes corrompidos ou duplicados.
- `pod-dns-error` / `pod-dns-spoof`: falhas de resolução de DNS (o famoso "sempre é DNS").

**HTTP (camada de aplicação)**

- `pod-http-latency`, `pod-http-status-code`, `pod-http-modify-body`: alteram as respostas HTTP de um serviço, simulando uma dependência que responde lento ou com erro 500.

**Node**

- `node-drain`: drena um nó, simulando manutenção ou perda de máquina.
- `node-cpu-hog` / `node-memory-hog`: estressam o nó inteiro.
- `kubelet-service-kill` / `node-restart`: falhas na infraestrutura do nó.

**Cloud**

- Faults específicos de provedores, como `ec2-terminate-by-id`, `ebs-loss`, e equivalentes para GCP e Azure, para quando a falha não está no cluster, mas na nuvem por baixo dele.

## E aí, Chaos Engineering é mesmo útil?

Sim. Mas não do jeito que muita gente imagina. Não é sobre sair quebrando produção para ver o circo pegar fogo. É sobre transformar "eu acho que meu sistema aguenta" em "eu **sei** que meu sistema aguenta, porque eu testei".

Toda prevenção que nunca foi testada é só uma hipótese. Fallback que nunca rodou, retry que nunca disparou, réplica que nunca assumiu... tudo isso funciona perfeitamente, até o dia em que você realmente precisa.

O caos já está aí, todos os dias. A diferença é se você vai conhecê-lo num experimento controlado ou num incidente às 3h da manhã.
