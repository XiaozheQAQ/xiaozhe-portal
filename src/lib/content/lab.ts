import { getCollection } from './loader';
import type { ContentItem } from './loader';
import type { LabFrontmatter, ProjectFrontmatter } from './schema';

export function getLabs() {
  return getLabEntries().filter((item) => item.data.status === 'researching');
}

export function getLab(slug: string) {
  const item = getLabEntries().find((entry) => entry.slug === slug);
  if (!item) return undefined;
  return { ...item, data: item.data as LabFrontmatter };
}

function normalizeLabItem(item: ContentItem) {
  return {
    ...item,
    data: item.data as LabFrontmatter
  };
}

function normalizeProjectItem(item: ContentItem) {
  const data = item.data as ProjectFrontmatter;
  return {
    ...item,
    data: {
      title: data.title,
      description: data.description,
      status: 'done' as const,
      date: '',
      tags: data.tech,
      featured: data.featured,
      slug: data.slug
    } satisfies LabFrontmatter
  };
}

export function getLabEntries() {
  const labs = getCollection('lab').map(normalizeLabItem);
  const projects = getCollection('projects').map(normalizeProjectItem);
  return [...labs, ...projects].sort((a, b) => {
    const ad = a.data.date || (a.data.status === 'researching' ? '9999-99-99' : '');
    const bd = b.data.date || (b.data.status === 'researching' ? '9999-99-99' : '');
    return bd.localeCompare(ad);
  });
}
