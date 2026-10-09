import { redirect } from '@sveltejs/kit';
import { getCollection } from '#lib/content/loader';

export function entries() {
  return getCollection('projects').map((project) => ({ slug: project.slug }));
}

export function load({ params }) {
  throw redirect(308, `/lab/${params.slug}`);
}
