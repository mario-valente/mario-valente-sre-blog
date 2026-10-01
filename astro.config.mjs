// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://mario-valente-sre-blog.pages.dev',
  output: 'static',
  redirects: {
    '/': '/pt/',
  },
  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [mdx(), sitemap()]
});