import type { RequestHandler } from './$types';
import { getPosts } from '#lib/content/blog';

export const prerender = true;

function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, (character) => {
    const entities: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      "'": '&apos;',
      '"': '&quot;'
    };
    return entities[character];
  });
}

export const GET: RequestHandler = ({ url }) => {
  const posts = getPosts();
  const entries = posts
    .map(
      (post) => `<item>
      <title>${escapeXml(post.data.title)}</title>
      <link>${url.origin}/blog/${post.slug}</link>
      <guid>${url.origin}/blog/${post.slug}</guid>
      <description>${escapeXml(post.data.description)}</description>
      <pubDate>${new Date(post.data.date).toUTCString()}</pubDate>
    </item>`
    )
    .join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>Xiaozhe — Writing</title><link>${url.origin}/blog</link>
<description>Notes about web, AI and systems.</description>
${entries}
</channel></rss>`,
    { headers: { 'content-type': 'application/rss+xml; charset=utf-8' } }
  );
};
