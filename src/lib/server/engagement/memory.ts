import type { EngagementStore } from './types';

export type MemoryStoreOptions = {
  /** Injectable clock so the expiry behaviour is testable. */
  now?: () => number;
};

/**
 * Process-local store, used only when nothing is configured AND the app runs in
 * development, so the counter can be reviewed without an account somewhere.
 *
 * It is deliberately not a production fallback: serverless instances do not
 * share memory, so the same article would report a different number depending on
 * which instance answered. Deployments must configure UPSTASH_REDIS_REST_URL and
 * UPSTASH_REDIS_REST_TOKEN, or accept that no count is shown at all.
 *
 * Expiry is lazy — a key that is past its window is dropped the next time it is
 * touched, which is enough for the dedupe and rate-limit windows this feature
 * uses.
 */
export function createMemoryStore(options: MemoryStoreOptions = {}): EngagementStore {
  const now = options.now ?? (() => Date.now());
  const values = new Map<string, number>();
  const expiresAt = new Map<string, number>();

  function isLive(key: string): boolean {
    const until = expiresAt.get(key);
    if (until !== undefined && now() >= until) {
      values.delete(key);
      expiresAt.delete(key);
      return false;
    }
    return values.has(key);
  }

  return {
    async getNumber(key) {
      return isLive(key) ? (values.get(key) as number) : 0;
    },
    async incr(key) {
      const next = (isLive(key) ? (values.get(key) as number) : 0) + 1;
      values.set(key, next);
      return next;
    },
    async expire(key, ttlSeconds) {
      if (ttlSeconds > 0) expiresAt.set(key, now() + ttlSeconds * 1000);
    },
    async setIfAbsent(key, value, ttlSeconds) {
      if (isLive(key)) return false;
      values.set(key, Number(value) || 0);
      if (ttlSeconds > 0) expiresAt.set(key, now() + ttlSeconds * 1000);
      return true;
    }
  };
}
