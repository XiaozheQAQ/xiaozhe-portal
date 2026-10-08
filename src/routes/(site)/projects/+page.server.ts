import { getProjects } from '#lib/content/projects';
export function load() { return { projects: getProjects() }; }
