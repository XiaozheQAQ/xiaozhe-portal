import type { RequestHandler } from './$types';
import { getPosts } from '#lib/content/blog';
import { getLabs } from '#lib/content/lab';
import { getProjects } from '#lib/content/projects';

export const prerender = true;

export const GET: RequestHandler = ({ url }) => {
  const paths = [
    '/',
    '/blog',
    '/projects',
    '/lab',
    '/about',
    ...getPosts().map((item) => `/blog/${item.slug}`),
    ...getProjects().map((item) => `/projects/${item.slug}`),
    ...getLabs().map((item) => `/lab/${item.slug}`)
  ];
  const body = paths.map((path) => `  <url><loc>${url.origin}${path}</loc></url>`).join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`,
    { headers: { 'content-type': 'application/xml; charset=utf-8' } }
  );
};
