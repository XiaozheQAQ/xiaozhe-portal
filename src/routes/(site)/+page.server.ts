import { getPosts } from '#lib/content/blog';

export function load() {
  return {
    posts: getPosts().slice(0, 4)
  };
}
