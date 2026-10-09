import { getPosts } from '#lib/content/blog';
import { getLabEntries } from '#lib/content/lab';

export function load() {
  return {
    query: '',
    items: [
      ...getPosts().map((item) => ({
        type: 'search.blog',
        href: `/blog/${item.slug}`,
        title: item.data.title,
        description: item.data.description,
        keywords: [...item.data.tags, item.data.category ?? ''].join(' ')
      })),
      ...getLabEntries().map((item) => ({
        type: 'search.lab',
        href: `/lab/${item.slug}`,
        title: item.data.title,
        description: item.data.description,
        keywords: [...item.data.tags, item.data.status].join(' ')
      }))
    ]
  };
}
