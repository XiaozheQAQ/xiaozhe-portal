import { error } from '@sveltejs/kit';
import { getLab } from '#lib/content/lab';

export function load({ params }) {
  const lab = getLab(params.slug);
  if (!lab) throw error(404, 'Lab item not found');
  return { lab };
}
