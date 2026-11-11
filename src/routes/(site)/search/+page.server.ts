import { getPosts } from '#lib/content/blog';
import { labProjects } from '#lib/features/lab/projects';

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
      ...labProjects.map((project) => ({
        type: 'search.lab',
        href: project.url,
        title: project.title,
        description: project.description,
        keywords: [project.title.replace(/\s+/g, ''), project.url, project.linkType, project.status, ...project.tags].join(' ')
      }))
    ]
  };
}
