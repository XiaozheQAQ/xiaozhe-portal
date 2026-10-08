import { getPosts } from '#lib/content/blog';
import { getLabs } from '#lib/content/lab';
import { getProjects } from '#lib/content/projects';

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
      ...getProjects().map((item) => ({
        type: 'search.project',
        href: `/projects/${item.slug}`,
        title: item.data.title,
        description: item.data.description,
        keywords: item.data.tech.join(' ')
      })),
      ...getLabs().map((item) => ({
        type: 'search.lab',
        href: `/lab/${item.slug}`,
        title: item.data.title,
        description: item.data.description,
        keywords: item.data.status
      }))
    ]
  };
}
