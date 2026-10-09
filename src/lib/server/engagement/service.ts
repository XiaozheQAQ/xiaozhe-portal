import type { ArticleStats, EngagementStore } from './types';

/** A visitor only counts once per article inside this window. */
export const VIEW_DEDUPE_SECONDS = 6 * 60 * 60;
export const RATE_LIMIT_WINDOW_SECONDS = 60;
export const RATE_LIMIT_MAX_REQUESTS = 60;
export const KEY_PREFIX = 'xz:v1';

export type EngagementAction = 'view';

export type EngagementErrorCode =
  | 'invalid_slug'
  | 'invalid_action'
  | 'unknown_article'
  | 'rate_limited';

export class EngagementError extends Error {
  code: EngagementErrorCode;
  status: number;

  constructor(code: EngagementErrorCode, message: string, status: number) {
    super(message);
    this.name = 'EngagementError';
    this.code = code;
    this.status = status;
  }
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ACTIONS: readonly string[] = ['view'];

/**
 * Slugs are checked against this pattern before they are ever used to build a
 * storage key, so a client cannot address arbitrary keys.
 */
export function normalizeSlug(value: unknown): string {
  if (typeof value !== 'string') throw new EngagementError('invalid_slug', 'Missing slug', 400);
  const slug = value.trim().toLowerCase();
  if (!slug || slug.length > 96 || !SLUG_PATTERN.test(slug)) {
    throw new EngagementError('invalid_slug', 'Invalid slug', 400);
  }
  return slug;
}

export function parseAction(value: unknown): EngagementAction {
  if (typeof value === 'string' && ACTIONS.includes(value)) return value as EngagementAction;
  throw new EngagementError('invalid_action', 'Unsupported action', 400);
}

export type EngagementServiceOptions = {
  /** Resolves a slug against the real content collection. */
  hasArticle: (slug: string) => boolean;
  viewDedupeSeconds?: number;
  rateLimitMax?: number;
  rateLimitWindowSeconds?: number;
};

export function createEngagementService(store: EngagementStore, options: EngagementServiceOptions) {
  const viewDedupeSeconds = options.viewDedupeSeconds ?? VIEW_DEDUPE_SECONDS;
  const rateLimitMax = options.rateLimitMax ?? RATE_LIMIT_MAX_REQUESTS;
  const rateLimitWindowSeconds = options.rateLimitWindowSeconds ?? RATE_LIMIT_WINDOW_SECONDS;

  const viewsKey = (slug: string) => `${KEY_PREFIX}:article:${slug}:views`;
  const viewKey = (slug: string, visitor: string) => `${KEY_PREFIX}:article:${slug}:view:${visitor}`;
  const rateKey = (visitor: string) => `${KEY_PREFIX}:rate:${visitor}`;

  function assertArticle(slug: string) {
    if (!options.hasArticle(slug)) {
      throw new EngagementError('unknown_article', 'Unknown article', 404);
    }
  }

  async function assertWithinRateLimit(visitor: string) {
    const key = rateKey(visitor);
    const used = await store.incr(key);
    if (used === 1) await store.expire(key, rateLimitWindowSeconds);
    if (used > rateLimitMax) {
      throw new EngagementError('rate_limited', 'Too many requests', 429);
    }
  }

  async function read(slug: string): Promise<ArticleStats> {
    assertArticle(slug);
    return { views: await store.getNumber(viewsKey(slug)) };
  }

  /**
   * Counts a view at most once per visitor per dedupe window. The dedupe key is
   * claimed with SET NX, so concurrent requests from the same visitor cannot all
   * win the increment.
   */
  async function registerView(slug: string, visitor: string): Promise<ArticleStats> {
    const claimed = await store.setIfAbsent(viewKey(slug, visitor), '1', viewDedupeSeconds);
    const views = claimed ? await store.incr(viewsKey(slug)) : await store.getNumber(viewsKey(slug));
    return { views };
  }

  async function apply(
    slug: string,
    visitor: string,
    action: EngagementAction
  ): Promise<ArticleStats> {
    assertArticle(slug);
    await assertWithinRateLimit(visitor);
    if (action === 'view') return registerView(slug, visitor);
    throw new EngagementError('invalid_action', 'Unsupported action', 400);
  }

  return { read, apply };
}

export type EngagementService = ReturnType<typeof createEngagementService>;
