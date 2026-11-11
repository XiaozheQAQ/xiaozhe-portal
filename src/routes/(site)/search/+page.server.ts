import { getPosts } from '#lib/content/blog';
import { labProjects, projectUrl } from '#lib/features/lab/projects';

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
        href: projectUrl(project),
        title: project.title,
        description: project.description,
        keywords: [project.repository, project.status, ...project.tech].join(' ')
      }))
    ]
  };
}
