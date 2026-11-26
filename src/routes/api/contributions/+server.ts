import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Public GitHub contribution calendar for the site owner, proxied here so the
 * browser talks to the same origin (no CORS, no third-party hop on the client)
 * and one cacheable response serves every visitor. The upstream is the public
 * github-contributions-api; nothing private is involved.
 *
 * If upstream is unreachable the endpoint still answers 200 with
 * available:false so the UI can fall back instead of showing fabricated data.
 */
const UPSTREAM = 'https://github-contributions-api.jogruber.de/v4/XiaozheQAQ?y=last';

export const prerender = false;

export const GET: RequestHandler = async ({ fetch, setHeaders }) => {
	try {
		const res = await fetch(UPSTREAM, { signal: AbortSignal.timeout(8000) });
		if (!res.ok) throw new Error(`upstream ${res.status}`);
		const data = (await res.json()) as {
			total?: { lastYear?: number };
			contributions?: Array<{ date: string; count: number; level: number }>;
		};
		const contributions = Array.isArray(data.contributions)
			? data.contributions.filter(
					(c) =>
						c &&
						typeof c.date === 'string' &&
						typeof c.count === 'number' &&
						typeof c.level === 'number'
				)
			: [];
		const total = typeof data.total?.lastYear === 'number' ? data.total.lastYear : 0;
		setHeaders({
			'cache-control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400'
		});
		return json({ available: true, total, contributions });
	} catch {
		setHeaders({ 'cache-control': 'no-store' });
		return json({ available: false, total: 0, contributions: [] });
	}
};
