import type { EngagementStore } from './types';

type Command = Array<string | number>;

export type UpstashConfig = {
  /** REST endpoint, e.g. https://eu1-xxx.upstash.io */
  url: string;
  /** REST token. Server-side only — never expose this to the browser. */
  token: string;
};

const asNumber = (value: unknown): number => {
  if (typeof value === 'number') return value;
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Minimal Upstash Redis REST client covering exactly the commands the
 * engagement feature uses. No SDK dependency required.
 */
export function createUpstashStore(config: UpstashConfig): EngagementStore {
  const endpoint = config.url.replace(/\/+$/, '');

  async function send(command: Command): Promise<unknown> {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${config.token}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify(command),
      cache: 'no-store'
    });
    if (!response.ok) {
      throw new Error(`Upstash request failed with status ${response.status}`);
    }
    const payload = (await response.json()) as { result?: unknown; error?: string };
    if (payload.error) throw new Error(`Upstash error: ${payload.error}`);
    return payload.result ?? null;
  }

  return {
    async getNumber(key) {
      return asNumber(await send(['GET', key]));
    },
    async incr(key) {
      return asNumber(await send(['INCR', key]));
    },
    async expire(key, ttlSeconds) {
      await send(['EXPIRE', key, ttlSeconds]);
    },
    async setIfAbsent(key, value, ttlSeconds) {
      return (await send(['SET', key, value, 'EX', ttlSeconds, 'NX'])) === 'OK';
    }
  };
}
