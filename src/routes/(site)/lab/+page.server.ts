import { getLabEntries } from '#lib/content/lab';
export function load() { return { labs: getLabEntries() }; }
