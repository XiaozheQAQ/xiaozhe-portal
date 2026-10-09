import { json } from '@sveltejs/kit';
import { UPSTASH_REDIS_REST_TOKEN, UPSTASH_REDIS_REST_URL } from '$app/env/private';
import type { RequestHandler } from './$types';
import { getPost } from '#lib/content/blog';
import {
  EngagementError,
  createEngagementService,
  normalizeSlug,
  parseAction,
  type EngagementService
} from '#lib/server/engagement/service';
import { createMemoryStore } from '#lib/server/engagement/memory';
import { createUpstashStore } from '#lib/server/engagement/upstash';

/**
 * Per-article view counter.
 *
 *   GET  /api/articles/:slug/engagement   read the view count
 *   POST /api/articles/:slug/engagement   { action: 'view' } — count this visit
 *
 * Likes are intentionally not part of this endpoint: a like is a GitHub reaction
 * on the article's discussion, so it requires a signed-in GitHub account and is
 * handled by giscus. Only anonymous view counts are stored here.
 *
 * Storage is Upstash Redis over REST. When the two environment variables below
 * are missing the endpoints answer with available:false and the page simply does
 * not render a counter — no placeholder, no error line. In development only, an
 * unconfigured build counts against a process-local store instead and marks the
 * response ephemeral so the UI can label what it is showing. No secret is ever
 * sent to the browser: the token is only read here, on the server.
 */
const VISITOR_COOKIE = 'xz_visitor';
const VISITOR_MAX_AGE = 60 * 60 * 24 * 365;
const VISITOR_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NO_STORE = { 'cache-control': 'no-store' } as const;

type ActiveService = {
  service: EngagementService;
  /** True when the counter lives in this process only (development fallback). */
  ephemeral: boolean;
};

let cached: ActiveService | null = null;
let cachedSignature = '';

function getService(): ActiveService | null {
  const url = UPSTASH_REDIS_REST_URL;
  const token = UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    // Never fall back in a deployment: serverless instances do not share memory,
    // so each one would report a different number for the same article.
    if (!import.meta.env.DEV) return null;
    if (!cached || cachedSignature !== 'memory') {
      cached = { service: build(createMemoryStore()), ephemeral: true };
      cachedSignature = 'memory';
    }
    return cached;
  }

  // Rebuild only when the configured endpoint actually changes.
  const signature = url + '|' + token.slice(-8);
  if (!cached || cachedSignature !== signature) {
    cached = { service: build(createUpstashStore({ url, token })), ephemeral: false };
    cachedSignature = signature;
  }
  return cached;
}

function build(store: Parameters<typeof createEngagementService>[0]): EngagementService {
  return createEngagementService(store, {
    // Only slugs that resolve to a real, published article may be addressed.
    hasArticle: (slug) => Boolean(getPost(slug))
  });
}

/**
 * Anonymous first-party visitor id. It is a random id, not an IP address and
 * not a fingerprint, and it is httpOnly so page scripts never read it.
 */
function readVisitor(cookies: Parameters<RequestHandler>[0]['cookies'], secure: boolean): string {
  const existing = cookies.get(VISITOR_COOKIE);
  if (existing && VISITOR_PATTERN.test(existing)) return existing;

  const created = globalThis.crypto.randomUUID();
  cookies.set(VISITOR_COOKIE, created, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: VISITOR_MAX_AGE,
    secure
  });
  return created;
}

function unavailable(reason: string, status: number) {
  return json({ available: false, reason }, { status, headers: NO_STORE });
}

function failure(error: unknown) {
  if (error instanceof EngagementError) {
    return json(
      { available: true, error: error.code, message: error.message },
      { status: error.status, headers: NO_STORE }
    );
  }
  console.error('[engagement] request failed', error);
  return unavailable('store_error', 502);
}

export const GET: RequestHandler = async ({ params }) => {
  const active = getService();
  if (!active) return unavailable('unconfigured', 200);

  try {
    const slug = normalizeSlug(params.slug);
    const stats = await active.service.read(slug);
    return json({ available: true, slug, ephemeral: active.ephemeral, ...stats }, { headers: NO_STORE });
  } catch (error) {
    return failure(error);
  }
};

export const POST: RequestHandler = async ({ params, cookies, url, request }) => {
  const active = getService();
  if (!active) return unavailable('unconfigured', 503);

  try {
    const slug = normalizeSlug(params.slug);
    const visitor = readVisitor(cookies, url.protocol === 'https:');

    let body: unknown = null;
    try {
      body = await request.json();
    } catch {
      body = null;
    }
    const action = parseAction((body as { action?: unknown } | null)?.action);

    const stats = await active.service.apply(slug, visitor, action);
    return json(
      { available: true, slug, action, ephemeral: active.ephemeral, ...stats },
      { headers: NO_STORE }
    );
  } catch (error) {
    return failure(error);
  }
};
