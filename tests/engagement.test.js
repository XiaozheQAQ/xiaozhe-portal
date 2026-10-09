// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EngagementError,
  RATE_LIMIT_WINDOW_SECONDS,
  VIEW_DEDUPE_SECONDS,
  createEngagementService,
  normalizeSlug,
  parseAction
} from '../src/lib/server/engagement/service.ts';
import { createMemoryStore } from '../src/lib/server/engagement/memory.ts';
import { createUpstashStore } from '../src/lib/server/engagement/upstash.ts';

/**
 * The development store under test — the same one a local run uses when nothing
 * is configured — wrapped so the tests can see which keys the service touched
 * and which TTLs it asked for.
 *
 * There is no like storage: likes are GitHub reactions on the discussion and
 * live entirely inside giscus.
 */
function trackedStore(options) {
  const store = createMemoryStore(options);
  const keys = new Set();
  const ttls = new Map();

  return {
    keys,
    ttls,
    async getNumber(key) {
      keys.add(key);
      return store.getNumber(key);
    },
    async incr(key) {
      keys.add(key);
      return store.incr(key);
    },
    async expire(key, ttlSeconds) {
      ttls.set(key, ttlSeconds);
      return store.expire(key, ttlSeconds);
    },
    async setIfAbsent(key, value, ttlSeconds) {
      keys.add(key);
      ttls.set(key, ttlSeconds);
      return store.setIfAbsent(key, value, ttlSeconds);
    }
  };
}

const PUBLISHED = ['why-personal-portal', 'another-article'];
const buildService = (store, overrides = {}) =>
  createEngagementService(store, {
    hasArticle: (slug) => PUBLISHED.includes(slug),
    ...overrides
  });

test('rejects malformed slugs before they can build a storage key', () => {
  assert.equal(normalizeSlug('why-personal-portal'), 'why-personal-portal');
  assert.equal(normalizeSlug('  Mixed-Case  '), 'mixed-case');
  for (const bad of ['', '  ', '../secret', 'a b', 'a/b', 'x'.repeat(97), 'a:b', null, 42, undefined, 'slug;DROP']) {
    assert.throws(() => normalizeSlug(bad), (error) => error instanceof EngagementError && error.code === 'invalid_slug');
  }
});

test('accepts only the documented action, so likes cannot be posted anonymously', () => {
  assert.equal(parseAction('view'), 'view');
  for (const bad of ['like', 'unlike', '', 'VIEW', 'delete', 'reset', null, 1, {}]) {
    assert.throws(() => parseAction(bad), (error) => error instanceof EngagementError && error.code === 'invalid_action' && error.status === 400);
  }
});

test('unknown articles are refused and never touch the store', async () => {
  const store = trackedStore();
  const service = buildService(store);
  for (const call of [() => service.read('ghost-post'), () => service.apply('ghost-post', 'visitor-a', 'view')]) {
    await assert.rejects(call, (error) => error instanceof EngagementError && error.code === 'unknown_article' && error.status === 404);
  }
  assert.equal(store.keys.size, 0, 'no key was created for the unknown slug');
});

test('two articles keep completely separate counters', async () => {
  const store = trackedStore();
  const service = buildService(store);

  await service.apply(PUBLISHED[0], 'visitor-a', 'view');
  await service.apply(PUBLISHED[0], 'visitor-a', 'view');
  await service.apply(PUBLISHED[1], 'visitor-b', 'view');

  const first = await service.read(PUBLISHED[0]);
  const second = await service.read(PUBLISHED[1]);

  assert.deepEqual(first, { views: 1 });
  assert.deepEqual(second, { views: 1 }, 'the second article counts on its own');
  assert.ok([...store.keys].some((key) => key.includes(PUBLISHED[0])));
  assert.ok([...store.keys].some((key) => key.includes(PUBLISHED[1])));
});

test('a visitor counts once per article inside the dedupe window', async () => {
  const store = trackedStore();
  const service = buildService(store);

  const first = await service.apply(PUBLISHED[0], 'visitor-a', 'view');
  const second = await service.apply(PUBLISHED[0], 'visitor-a', 'view');
  const third = await service.apply(PUBLISHED[0], 'visitor-a', 'view');
  assert.equal(first.views, 1);
  assert.equal(second.views, 1, 'refreshing must not inflate the counter');
  assert.equal(third.views, 1);

  const other = await service.apply(PUBLISHED[0], 'visitor-b', 'view');
  assert.equal(other.views, 2, 'a different visitor does count');

  // The dedupe key really does carry the documented TTL.
  const dedupeKey = [...store.ttls.keys()].find((key) => key.includes(':view:'));
  assert.equal(store.ttls.get(dedupeKey), VIEW_DEDUPE_SECONDS, '6 hour window');
});

test('reads never change the counters', async () => {
  const store = trackedStore();
  const service = buildService(store);
  await service.apply(PUBLISHED[0], 'visitor-a', 'view');
  for (let i = 0; i < 5; i++) {
    assert.deepEqual(await service.read(PUBLISHED[0]), { views: 1 });
  }
});

test('simultaneous views from one visitor count exactly once', async () => {
  const store = trackedStore();
  const service = buildService(store);

  const results = await Promise.all(
    Array.from({ length: 12 }, () => service.apply(PUBLISHED[0], 'visitor-a', 'view'))
  );
  assert.equal(results.at(-1).views, 1, 'only one of the concurrent requests won the dedupe claim');
  assert.ok(results.every((entry) => entry.views === 1));
});

test('requests beyond the rate limit are refused', async () => {
  const store = trackedStore();
  const service = buildService(store, { rateLimitMax: 3, rateLimitWindowSeconds: 30 });

  for (let i = 0; i < 3; i++) await service.apply(PUBLISHED[0], 'visitor-a', 'view');

  await assert.rejects(
    () => service.apply(PUBLISHED[0], 'visitor-a', 'view'),
    (error) => error instanceof EngagementError && error.code === 'rate_limited' && error.status === 429
  );

  // Another visitor is unaffected, and the limiter key carries the window TTL.
  const other = await service.apply(PUBLISHED[0], 'visitor-b', 'view');
  assert.equal(other.views, 2, 'visitor-a already counted once, visitor-b adds a second view');
  const rateKey = [...store.ttls.keys()].find((key) => key.includes(':rate:'));
  assert.equal(store.ttls.get(rateKey), 30);
  assert.equal(RATE_LIMIT_WINDOW_SECONDS, 60);
});

test('development store counts, refuses a second claim and expires lazily', async () => {
  let clock = 1_000_000;
  const store = createMemoryStore({ now: () => clock });

  assert.equal(await store.getNumber('missing'), 0, 'a missing key reads as zero');
  assert.equal(await store.incr('views'), 1);
  assert.equal(await store.incr('views'), 2);
  assert.equal(await store.setIfAbsent('dedupe', '1', 60), true);
  assert.equal(await store.setIfAbsent('dedupe', '1', 60), false, 'a live key is never re-claimed');

  clock += 60_001;
  assert.equal(await store.getNumber('dedupe'), 0, 'the window closed, so the claim is gone');
  assert.equal(await store.setIfAbsent('dedupe', '1', 60), true, 'and it can be claimed again');
  assert.equal(await store.getNumber('views'), 2, 'a counter without a TTL ignores the clock');
});

test('development store gives the service the same behaviour as a real store', async () => {
  let clock = 0;
  const service = buildService(createMemoryStore({ now: () => clock }));

  assert.equal((await service.apply(PUBLISHED[0], 'visitor-a', 'view')).views, 1);
  assert.equal((await service.apply(PUBLISHED[0], 'visitor-a', 'view')).views, 1, 'dedupe holds');

  clock += VIEW_DEDUPE_SECONDS * 1000 + 1;
  assert.equal(
    (await service.apply(PUBLISHED[0], 'visitor-a', 'view')).views,
    2,
    'once the window closes the same visitor counts again'
  );
});

test('upstash adapter maps the interface onto REST commands', async () => {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    const command = JSON.parse(init.body);
    calls.push({ url, command, authorization: init.headers.authorization });
    let result = null;
    if (command[0] === 'GET') result = '7';
    if (command[0] === 'INCR') result = 8;
    if (command[0] === 'SET') result = 'OK';
    return { ok: true, json: async () => ({ result }) };
  };

  try {
    const store = createUpstashStore({ url: 'https://example.upstash.io/', token: 'secret-token' });
    assert.equal(await store.getNumber('k'), 7);
    assert.equal(await store.incr('k'), 8);
    assert.equal(await store.setIfAbsent('k', '1', 60), true);

    assert.equal(calls[0].url, 'https://example.upstash.io', 'trailing slash is trimmed');
    assert.deepEqual(calls[0].command, ['GET', 'k']);
    assert.deepEqual(calls[1].command, ['INCR', 'k']);
    assert.deepEqual(calls[2].command, ['SET', 'k', '1', 'EX', 60, 'NX'], 'view dedupe uses SET NX EX');
    assert.equal(calls[0].authorization, 'Bearer secret-token');
  } finally {
    globalThis.fetch = original;
  }
});

test('upstash adapter surfaces transport and command failures', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({ ok: false, status: 500, json: async () => ({}) });
    const store = createUpstashStore({ url: 'https://example.upstash.io', token: 't' });
    await assert.rejects(() => store.getNumber('k'), /status 500/);

    globalThis.fetch = async () => ({ ok: true, json: async () => ({ error: 'WRONGTYPE' }) });
    const failing = createUpstashStore({ url: 'https://example.upstash.io', token: 't' });
    await assert.rejects(() => failing.incr('k'), /WRONGTYPE/);

    globalThis.fetch = async () => {
      throw new Error('network down');
    };
    const offline = createUpstashStore({ url: 'https://example.upstash.io', token: 't' });
    await assert.rejects(() => offline.incr('k'), /network down/);
  } finally {
    globalThis.fetch = original;
  }
});
