import { getPosts } from '#lib/content/blog';
export function load() { return { posts: getPosts() }; }
