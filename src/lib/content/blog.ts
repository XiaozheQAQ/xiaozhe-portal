import { getBySlug, getCollection } from './loader';
import type { BlogFrontmatter } from './schema';

export function getPosts() {
  return getCollection('blog')
    .map((post) => ({ ...post, data: post.data as BlogFrontmatter }))
    .filter((post) => !post.data.draft);
}

export function getFeaturedPosts() {
  return getPosts().filter((post) => post.data.featured);
}

export function getPost(slug: string) {
  const post = getBySlug('blog', slug);
  if (!post) return undefined;
  return { ...post, data: post.data as BlogFrontmatter };
}

export const getLatestPosts = () => getPosts();
export const getPostsByTag = (tag: string) =>
  getPosts().filter((post) => post.data.tags.includes(tag));
export const getPostsByCategory = (category: string) =>
  getPosts().filter((post) => post.data.category === category);
