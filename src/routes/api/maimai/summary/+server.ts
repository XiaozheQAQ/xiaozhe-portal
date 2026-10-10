import { json } from '@sveltejs/kit';
import { LXNS_DEVELOPER_API_KEY, MAIMAI_FRIEND_CODE } from '$app/env/private';
import type { RequestHandler } from './$types';
import { buildMaimaiSummary } from '#lib/server/maimai/summary';

/**
 * GET /api/maimai/summary
 *
 * The public maimai DX archive shown on /status: player profile, Best 50,
 * DX Rating trend and recent plays, read from the LXNS 落雪查分器 developer API.
 *
 * The two environment variables below are private and are read here only. They
 * are never returned, never logged and never reach the browser: the response
 * carries display data and per-section statuses, nothing else. When either one
 * is missing the endpoint still answers 200 so the page can render its "data
 * pending" state, and it is not cached in that case.
 *
 * Caching is left to the HTTP layer (Vercel's shared cache honours s-maxage and
 * stale-while-revalidate), which is what makes the ~5 minute window work across
 * serverless instances. There is deliberately no process-local cache: separate
 * instances would each keep their own copy and visitors would see different
 * archives. `cacheSeconds` in the payload is the lifetime the cache should use;
 * a degraded archive uses a shorter one so it recovers quickly.
 */
export const prerender = false;

export const GET: RequestHandler = async ({ fetch, setHeaders }) => {
  const payload = await buildMaimaiSummary({
    apiKey: LXNS_DEVELOPER_API_KEY,
    friendCode: MAIMAI_FRIEND_CODE,
    fetchImpl: fetch
  });

  const cacheControl = payload.cacheSeconds > 0
    ? `public, max-age=${payload.cacheSeconds}, s-maxage=${payload.cacheSeconds}, stale-while-revalidate=600`
    : 'no-store';

  setHeaders({
    'cache-control': cacheControl,
    'content-type': 'application/json; charset=utf-8'
  });

  return json(payload, { headers: { 'cache-control': cacheControl } });
};
