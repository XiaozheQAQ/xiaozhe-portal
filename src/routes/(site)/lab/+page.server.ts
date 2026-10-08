import { getLabs } from '#lib/content/lab';
export function load() { return { labs: getLabs() }; }
