/**
 * Only views are counted here. Likes are GitHub reactions on the article's
 * discussion and belong to giscus: keeping a second, anonymous like store would
 * mean two like mechanisms with two different meanings.
 */
export type ArticleStats = {
  /** Total registered views for the article. */
  views: number;
};

/**
 * The small slice of a key/value store this feature needs. Implemented by the
 * Upstash Redis REST adapter in production and by an in-memory double in tests.
 */
export interface EngagementStore {
  getNumber(key: string): Promise<number>;
  incr(key: string): Promise<number>;
  expire(key: string, ttlSeconds: number): Promise<void>;
  /** SET key value EX ttl NX — true when this call created the key. */
  setIfAbsent(key: string, value: string, ttlSeconds: number): Promise<boolean>;
}
