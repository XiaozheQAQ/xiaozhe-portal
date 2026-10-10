import type { RequestHandler } from './$types';
import { getPosts } from '#lib/content/blog';
import { getLabEntries } from '#lib/content/lab';
import { machineDate } from '#lib/seo/meta';

export const prerender = true;

export const GET: RequestHandler = ({ url }) => {
  // The newest piece of writing tells crawlers when the index itself changed.
  const latest = [
    ...getPosts().map((item) => machineDate(item.data.updated || item.data.date) || ''),
    ...getLabEntries().map((item) => machineDate(item.data.date) || '')
  ]
    .sort()
    .at(-1);
  const pages: { path: string; lastmod?: string }[] = [
    { path: '/', lastmod: machineDate(latest) },
    { path: '/blog' },
    { path: '/lab' },
    { path: '/status' },
    { path: '/about' },
    ...getPosts().map((item) => ({ path: `/blog/${item.slug}`, lastmod: machineDate(item.data.updated || item.data.date) })),
    ...getLabEntries().map((item) => ({ path: `/lab/${item.slug}`, lastmod: machineDate(item.data.date) }))
  ];
  const body = pages
    .map((page) => `  <url><loc>${url.origin}${page.path}</loc>${page.lastmod ? `<lastmod>${page.lastmod}</lastmod>` : ''}</url>`)
    .join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`,
    { headers: { 'content-type': 'application/xml; charset=utf-8' } }
  );
};
