export const languages = {
  en: 'English',
  pt: 'Português',
} as const;

export type Lang = keyof typeof languages;

export const defaultLang: Lang = 'pt';

export const ui = {
  en: {
    'site.title': 'Mario Valente — SRE Notes',
    'site.tagline': 'Site Reliability, observability, and infrastructure notes.',
    'nav.home': 'Home',
    'nav.blog': 'Articles',
    'nav.tags': 'Tags',
    'nav.about': 'About',
    'home.hero.title': 'Reliability engineering, in writing.',
    'home.hero.subtitle':
      'Notes, experiments and deep dives on SRE, observability, Kubernetes, GitOps and everything that keeps production alive.',
    'home.latest': 'Latest articles',
    'home.viewAll': 'View all articles',
    'blog.title': 'Articles',
    'blog.subtitle': 'Everything I write about SRE, platform engineering and reliability.',
    'blog.readMore': 'Read article',
    'blog.minRead': 'min read',
    'blog.publishedOn': 'Published on',
    'blog.updatedOn': 'Updated on',
    'blog.related': 'Keep reading',
    'blog.backToBlog': 'Back to all articles',
    'blog.tags': 'Tags',
    'blog.empty': 'No articles yet. Come back soon!',
    'tags.title': 'Tags',
    'tags.postsTagged': 'Articles tagged',
    'footer.rights': 'All rights reserved.',
    'footer.builtWith': 'Built with Astro, deployed on Cloudflare Pages.',
    'theme.toggle': 'Toggle theme',
    'lang.switch': 'Language',
  },
  pt: {
    'site.title': 'Mario Valente — Notas de SRE',
    'site.tagline': 'Notas sobre confiabilidade, observabilidade e infraestrutura.',
    'nav.home': 'Início',
    'nav.blog': 'Artigos',
    'nav.tags': 'Tags',
    'nav.about': 'Sobre',
    'home.hero.title': 'Engenharia de confiabilidade, por escrito.',
    'home.hero.subtitle':
      'Notas, experimentos e mergulhos profundos sobre SRE, observabilidade, Kubernetes, GitOps e tudo que mantém a produção de pé.',
    'home.latest': 'Últimos artigos',
    'home.viewAll': 'Ver todos os artigos',
    'blog.title': 'Artigos',
    'blog.subtitle': 'Tudo o que escrevo sobre SRE, platform engineering e confiabilidade.',
    'blog.readMore': 'Ler artigo',
    'blog.minRead': 'min de leitura',
    'blog.publishedOn': 'Publicado em',
    'blog.updatedOn': 'Atualizado em',
    'blog.related': 'Continue lendo',
    'blog.backToBlog': 'Voltar para todos os artigos',
    'blog.tags': 'Tags',
    'blog.empty': 'Nenhum artigo ainda. Volte em breve!',
    'tags.title': 'Tags',
    'tags.postsTagged': 'Artigos com a tag',
    'footer.rights': 'Todos os direitos reservados.',
    'footer.builtWith': 'Feito com Astro, publicado no Cloudflare Pages.',
    'theme.toggle': 'Alternar tema',
    'lang.switch': 'Idioma',
  },
} as const;
