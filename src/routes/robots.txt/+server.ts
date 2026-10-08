import type { RequestHandler } from './$types';

export const prerender = true;

export const GET: RequestHandler = ({ url }) =>
  new Response(`User-agent: *
Allow: /
Sitemap: ${url.origin}/sitemap.xml
`, {
    headers: { 'content-type': 'text/plain; charset=utf-8' }
  });
