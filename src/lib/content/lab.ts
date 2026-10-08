import { getBySlug, getCollection } from './loader';
import type { LabFrontmatter } from './schema';

export function getLabs() {
  return getCollection('lab').map((item) => ({
    ...item,
    data: item.data as LabFrontmatter
  }));
}

export function getLab(slug: string) {
  const item = getBySlug('lab', slug);
  if (!item) return undefined;
  return { ...item, data: item.data as LabFrontmatter };
}
