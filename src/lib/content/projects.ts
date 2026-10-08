import { getBySlug, getCollection } from './loader';
import type { ProjectFrontmatter } from './schema';

export function getProjects() {
  return getCollection('projects').map((project) => ({
    ...project,
    data: project.data as ProjectFrontmatter
  }));
}

export function getFeaturedProjects() {
  return getProjects().filter((project) => project.data.featured);
}

export function getProject(slug: string) {
  const project = getBySlug('projects', slug);
  if (!project) return undefined;
  return { ...project, data: project.data as ProjectFrontmatter };
}
