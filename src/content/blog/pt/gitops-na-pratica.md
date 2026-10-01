---
title: "GitOps na prática: por que o cluster nunca deveria ser editado na mão"
description: "Como ArgoCD e Kargo transformam o cluster Kubernetes em um reflexo fiel do Git, e por que isso muda tudo em incidentes."
pubDate: 2024-03-05
lang: "pt"
tags: ["gitops", "kubernetes", "argocd"]
translationKey: "gitops-in-practice"
---

Uma das maiores fontes de incidentes em plataformas Kubernetes não é código de aplicação — é **drift de configuração**: alguém roda um `kubectl edit` às 2h da manhã para "resolver rápido" e esquece de refletir a mudança no Git.

## O princípio central do GitOps

O Git é a **fonte única de verdade**. Qualquer mudança no cluster deveria nascer de um commit, passar por revisão, e ser aplicada por um controlador — nunca por um `kubectl apply` manual.

```
Git commit → Pull Request → Merge → Controller detecta → Sincroniza cluster
```

## ArgoCD: o operador de sincronização

O ArgoCD observa repositórios Git e aplica automaticamente qualquer divergência entre o estado declarado e o estado real do cluster. Se alguém editar algo manualmente, o ArgoCD reverte (ou alerta, dependendo da política de sync).

## Kargo: promoção controlada entre ambientes

Enquanto o ArgoCD cuida da sincronização all Git → cluster, o **Kargo** orquestra a *promoção* de versões entre estágios (dev → staging → produção), com verificações automatizadas no meio do caminho.

> Em ambientes com múltiplos engenheiros mexendo na mesma infraestrutura, GitOps não é luxo — é o que garante que ninguém sobrescreva o trabalho de outra pessoa sem perceber.

## O que isso muda em um incidente

Quando um incidente acontece, a pergunta deixa de ser "o que alguém mudou no cluster?" e passa a ser "qual foi o último commit mergeado?". Isso transforma troubleshooting em algo auditável, reversível e, acima de tudo, **rastreável**.
