# Mario Valente — SRE Notes

Blog estático sobre SRE, observabilidade, Kubernetes e GitOps, feito em [Astro](https://astro.build) + Tailwind CSS v4, pronto para deploy no **Cloudflare Pages**.

## ✨ Recursos

- **100% estático** (`output: 'static'`) — HTML puro gerado em build, sem servidor necessário.
- **Dark mode** com toggle manual + detecção de preferência do sistema, sem flash de tela clara (script inline no `<head>`).
- **Tradução PT/EN** via rotas `/pt/...` e `/en/...`, com dicionário de UI em `src/i18n/ui.ts` e troca de idioma preservando o artigo equivalente (campo `translationKey` no frontmatter).
- **Artigos relacionados** ao fim de cada post, calculados por tags em comum.
- **Tags** com página de listagem e filtro por tag.
- **RSS** em `/rss.xml` e `sitemap.xml` automático.
- Design com paleta "dashboard de observabilidade": fundo escuro + acentos vivos (verde uptime, ciano de sinal, laranja de alerta, magenta de incidente).

## 🗂 Estrutura

```
src/
├── content/
│   └── blog/
│       ├── en/*.md      # artigos em inglês
│       └── pt/*.md      # artigos em português
├── content.config.ts    # schema das collections (title, tags, lang, pubDate...)
├── i18n/                # dicionário de traduções da UI + helpers
├── layouts/BaseLayout.astro
├── components/          # Header, Footer, ThemeToggle, LangSwitcher, PostCard, Tag, RelatedPosts
└── pages/
    ├── index.astro      # redireciona "/" -> "/pt/"
    ├── rss.xml.js
    ├── 404.astro
    └── [lang]/
        ├── index.astro          # home
        ├── blog/index.astro     # listagem
        ├── blog/[...slug].astro # artigo
        ├── tags/index.astro
        └── tags/[tag].astro
```

## ✍️ Como publicar um novo artigo

1. Crie um arquivo `.md` (ou `.mdx`) em `src/content/blog/pt/` ou `src/content/blog/en/`.
2. Preencha o frontmatter:

   ```md
   ---
   title: "Título do artigo"
   description: "Resumo curto para SEO e cards"
   pubDate: 2024-05-01
   lang: "pt"           # ou "en"
   tags: ["sre", "kubernetes"]
   translationKey: "meu-artigo"  # opcional: liga a versão em outro idioma
   heroImage: ./capa.jpg          # opcional
   draft: false
   ---
   ```

3. Escreva o conteúdo em Markdown normalmente. O artigo aparece automaticamente na home, na listagem `/[lang]/blog/`, nas páginas de tag e no RSS.
4. Se publicar a tradução do mesmo artigo no outro idioma, use o **mesmo `translationKey`** — isso ativa o link direto entre idiomas no seletor do header quando você estiver lendo o post.

## 🧞 Comandos

| Comando             | Ação                                               |
| -------------------- | --------------------------------------------------- |
| `npm install`        | Instala as dependências                             |
| `npm run dev`         | Servidor local em `http://localhost:4321`           |
| `npm run build`       | Gera o site estático em `./dist/`                   |
| `npm run preview`     | Serve o build de produção localmente                |
| `npx astro check`     | Checagem de tipos                                   |

## ☁️ Deploy no Cloudflare Pages

**Opção A — via dashboard (recomendado):**

1. Suba este repositório no GitHub/GitLab.
2. Em Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
3. Configure o build:
   - **Framework preset:** Astro
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Deploy. Cada push na branch principal gera um novo deploy automaticamente.

**Opção B — via Wrangler CLI:**

```sh
npm run build
npx wrangler pages deploy dist --project-name=mario-valente-sre-blog
```

> Atualize `site` em `astro.config.mjs` para o domínio final (ex.: `https://seu-dominio.com`) antes do primeiro deploy, para que RSS, sitemap e Open Graph apontem para as URLs corretas.

## 🎨 Paleta de cores

| Token                      | Uso                                  |
| -------------------------- | ------------------------------------- |
| `--color-signal-cyan`      | Links, destaques, hover (light mode)  |
| `--color-uptime-green`     | Status "operacional", destaques dark  |
| `--color-alert-orange`     | Blockquotes, ícone de relacionados    |
| `--color-incident-magenta` | Variação de tags / páginas de erro    |
| `--color-latency-violet`   | Variação de tags                      |
