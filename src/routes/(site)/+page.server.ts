import { getPosts } from '#lib/content/blog';
import { getLabEntries } from '#lib/content/lab';

export function load() {
  const labs = getLabEntries();
  const researching = labs.filter((item) => item.data.status === 'researching');
  const completed = labs.filter((item) => item.data.status === 'done' && item.data.featured);
  return {
    posts: getPosts().slice(0, 4),
    labs: [...researching.slice(0, 2), ...completed.slice(0, 1)]
  };
}
