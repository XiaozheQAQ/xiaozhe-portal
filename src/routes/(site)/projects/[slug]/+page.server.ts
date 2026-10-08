import { error } from '@sveltejs/kit';
import { getProject } from '#lib/content/projects';

export function load({ params }) {
  const project = getProject(params.slug);
  if (!project) throw error(404, 'Project not found');
  return { project };
}
