import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const sorted = posts.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());

  return rss({
    title: 'Mario Valente — SRE Notes',
    description: 'Site Reliability, observability, and infrastructure notes.',
    site: context.site,
    items: sorted.map((post) => {
      const [lang, ...rest] = post.id.split('/');
      return {
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.pubDate,
        link: `/${lang}/blog/${rest.join('/')}/`,
      };
    }),
  });
}
