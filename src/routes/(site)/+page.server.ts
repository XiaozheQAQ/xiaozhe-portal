import { getPosts } from '#lib/content/blog';
import { getFeaturedProjects } from '#lib/content/projects';
import { getLabs } from '#lib/content/lab';

export function load() {
  return {
    posts: getPosts().slice(0, 4),
    projects: getFeaturedProjects().slice(0, 3),
    labs: getLabs().slice(0, 3)
  };
}
