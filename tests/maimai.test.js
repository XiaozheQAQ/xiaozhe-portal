// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';
import {
  CACHE_SECONDS,
  DEGRADED_CACHE_SECONDS,
  FRIEND_CODE_PATTERN,
  LXNS_API_BASE,
  LXNS_ASSET_BASE,
  assetUrl,
  buildMaimaiSummary,
  mapBests,
  mapScore,
  mapTrend,
  readSection
} from '../src/lib/server/maimai/summary.ts';

/**
 * The upstream is never contacted here: every case drives the mapper with a
 * stubbed fetch that returns the documented envelope, so the parsing and the
 * per-section status logic are verified without a real API key.
 *
 * The fixtures below are shaped like the documented payloads (they are test
 * input, not page content — the page itself has no fallback data at all).
 */
const API_KEY = 'test-key-not-a-secret';
const FRIEND_CODE = '123456789012';

const PLAYER = {
  name: 'Xiaozhe',
  rating: 16412,
  friend_code: 123456789012,
  course_rank: 23,
  class_rank: 25,
  star: 0,
  trophy: { id: -1, name: '理论值', genre: '', color: 'Rainbow' },
  icon: { id: 1, name: '', genre: '' },
  name_plate: { id: 12001, name: '测试姓名框', genre: '' },
  frame: null,
  upload_time: '2026-10-10T08:30:00Z'
};

const SCORE_STANDARD = {
  id: 834,
  song_name: 'Falsum Atlantis.',
  level: '14+',
  level_index: 3,
  achievements: 100.7895,
  fc: 'ap',
  fs: 'fsd',
  dx_score: 2503,
  dx_star: 5,
  dx_rating: 302,
  rate: 'sssp',
  type: 'standard',
  play_time: '2026-10-09T13:45:00Z',
  upload_time: '2026-10-09T13:50:00Z',
  last_played_time: '2026-10-09T13:45:00Z'
};

const SCORE_DX = {
  id: 100001,
  song_name: '宴会场测试',
  level: '13',
  level_index: 2,
  achievements: 99.5,
  fc: null,
  fs: null,
  dx_score: 1800,
  dx_star: 3,
  dx_rating: 214,
  rate: 'ss',
  type: 'utage',
  upload_time: '2026-10-08T10:00:00Z'
};

const BESTS = {
  standard_total: 16100,
  dx_total: 15900,
  standard: [SCORE_STANDARD],
  dx: [SCORE_DX],
  standard_selections: [],
  dx_selections: []
};

const TREND = [
  { total: 16100, standard: 8100, dx: 8000, date: '2026-10-08' },
  { total: 16300, standard: 8150, dx: 8150, date: '2026-10-06' },
  { total: 16412, standard: 8200, dx: 8212, date: '2026-10-10' }
];

const RECENTS = [
  { ...SCORE_STANDARD, play_time: '2026-10-10T07:12:00Z' },
  { id: 1234, song_name: '无游玩时间', level: '12+', level_index: 2, achievements: 98, type: 'dx', upload_time: '2026-10-10T07:30:00Z', play_time: null }
];

function envelope(data, code = 200, success = true) {
  return { success, code, data };
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}

/** Builds the standard route table so a test only names the interesting paths. */
function okRoutes(overrides = {}) {
  return {
    [`/maimai/player/${FRIEND_CODE}`]: () => jsonResponse(envelope(PLAYER)),
    [`/maimai/player/${FRIEND_CODE}/bests`]: () => jsonResponse(envelope(BESTS)),
    [`/maimai/player/${FRIEND_CODE}/trend`]: () => jsonResponse(envelope(TREND)),
    [`/maimai/player/${FRIEND_CODE}/recents`]: () => jsonResponse(envelope(RECENTS)),
    ...overrides
  };
}

/**
 * Stubbed `fetch`. Returns the captured calls so a test can check the URL, the
 * auth header and the abort signal, and answers 404 for paths a test left out.
 */
function stubFetch(routes = {}) {
  const calls = [];
  const fetchImpl = async (input, init) => {
    calls.push({ url: String(input), init });
    const path = String(input).slice(LXNS_API_BASE.length);
    const handler = routes[path];
    if (!handler) return jsonResponse({ success: false, code: 404, message: 'not found' }, 404);
    return typeof handler === 'function' ? handler(input, init) : handler;
  };
  return { calls, fetchImpl };
}

function build(routes, options = {}) {
  const stub = stubFetch(routes);
  return { stub, run: () => buildMaimaiSummary({ apiKey: API_KEY, friendCode: FRIEND_CODE, fetchImpl: stub.fetchImpl, ...options }) };
}

/** Nothing in the payload may echo the key or the friend code. */
function expectNoSecrets(payload) {
  const text = JSON.stringify(payload);
  assert.equal(text.includes(API_KEY), false, 'the API key must not appear in the payload');
  assert.equal(text.includes(FRIEND_CODE), false, 'the friend code must not appear in the payload');
  assert.equal(/authorization/i.test(text), false, 'no request header may appear in the payload');
}

// ── happy path ──────────────────────────────────────────────────────────────

test('maps all four sections when upstream answers', async () => {
  const { stub, run } = build(okRoutes());
  const payload = await run();

  assert.equal(payload.configured, true);
  assert.equal(payload.source, 'lxns');
  assert.equal(payload.cacheSeconds, CACHE_SECONDS);
  assert.equal(payload.sections.profile.status, 'ok');
  assert.equal(payload.sections.bests.status, 'ok');
  assert.equal(payload.sections.trend.status, 'ok');
  assert.equal(payload.sections.recents.status, 'ok');
  assert.equal(payload.sections.bests.count, 2);
  assert.equal(payload.sections.trend.count, 3);
  assert.equal(payload.sections.recents.count, 2);

  // Profile
  assert.equal(payload.profile.name, 'Xiaozhe');
  assert.equal(payload.profile.rating, 16412);
  assert.equal(payload.profile.courseRank, 23);
  assert.equal(payload.profile.classRank, 25);
  assert.equal(payload.profile.star, 0);
  assert.equal(payload.profile.trophy.name, '理论值');
  assert.equal(payload.profile.trophy.color, 'rainbow');
  assert.equal(payload.profile.iconUrl, `${LXNS_ASSET_BASE}/icon/1.png`);
  assert.equal(payload.profile.namePlateUrl, `${LXNS_ASSET_BASE}/plate/12001.png`);
  assert.equal(payload.profile.frameUrl, null, 'a null frame has no asset url');
  assert.equal(payload.profile.syncedAt, '2026-10-10T08:30:00Z');

  // Best 50 totals keep the documented meaning and are never double counted.
  assert.equal(payload.bests.standardTotal, 16100);
  assert.equal(payload.bests.dxTotal, 15900);
  assert.equal(payload.bests.total, 32000);
  assert.equal(payload.bests.standard.length, 1);
  assert.equal(payload.bests.dx.length, 1);
  const best = payload.bests.standard[0];
  assert.equal(best.songName, 'Falsum Atlantis.');
  assert.equal(best.level, '14+');
  assert.equal(best.levelIndex, 3);
  assert.equal(best.chartType, 'standard');
  assert.equal(best.achievements, 100.7895);
  assert.equal(best.rate, 'sssp');
  assert.equal(best.combo, 'ap');
  assert.equal(best.sync, 'fsd');
  assert.equal(best.dxScore, 2503);
  assert.equal(best.dxStar, 5);
  assert.equal(best.dxRating, 302);
  assert.equal(best.jacketUrl, `${LXNS_ASSET_BASE}/jacket/834.png`);
  assert.equal(best.playTime, '2026-10-09T13:45:00Z');
  assert.equal(best.uploadedAt, '2026-10-09T13:50:00Z');

  // Trend is ordered oldest first so a chart reads left to right.
  assert.deepEqual(
    payload.trend.map((point) => point.date),
    ['2026-10-06', '2026-10-08', '2026-10-10']
  );
  assert.deepEqual(payload.trend[2], { date: '2026-10-10', total: 16412, standard: 8200, dx: 8212 });

  expectNoSecrets(payload);
});

test('calls the documented URLs once each with the key in the auth header', async () => {
  const { stub, run } = build(okRoutes());
  await run();

  assert.equal(stub.calls.length, 4);
  const paths = stub.calls.map((call) => call.url.slice(LXNS_API_BASE.length)).sort();
  assert.deepEqual(paths, [
    `/maimai/player/${FRIEND_CODE}`,
    `/maimai/player/${FRIEND_CODE}/bests`,
    `/maimai/player/${FRIEND_CODE}/recents`,
    `/maimai/player/${FRIEND_CODE}/trend`
  ]);
  for (const call of stub.calls) {
    assert.equal(call.url.startsWith(`${LXNS_API_BASE}/maimai/player/`), true);
    assert.equal(call.url.includes('/api/v0/api/v0'), false, 'the base url must not be doubled');
    const headers = call.init?.headers ?? {};
    assert.equal(headers.authorization, API_KEY);
    assert.ok(call.init?.signal, 'every upstream read carries a timeout signal');
  }
});

test('shows the real play time and keeps the upload time apart', async () => {
  const { run } = build(okRoutes());
  const payload = await run();
  const [recentWithTime, recentWithoutTime] = payload.recents;

  assert.equal(recentWithTime.playTime, '2026-10-10T07:12:00Z');
  assert.equal(recentWithoutTime.playTime, null, 'a missing play_time stays missing');
  assert.equal(recentWithoutTime.uploadedAt, '2026-10-10T07:30:00Z');
  assert.notEqual(recentWithoutTime.playTime, recentWithoutTime.uploadedAt, 'upload_time is never a play time');
});

// ── partial availability ────────────────────────────────────────────────────

test('one failing upstream never hides the sections that worked', async () => {
  const routes = okRoutes({
    [`/maimai/player/${FRIEND_CODE}/recents`]: () => jsonResponse({ success: false, code: 500, message: 'boom' }, 500)
  });
  const { run } = build(routes);
  const payload = await run();

  assert.equal(payload.sections.recents.status, 'upstream_error');
  assert.equal(payload.sections.recents.count, 0);
  assert.equal(payload.recents, null);
  assert.equal(payload.sections.profile.status, 'ok');
  assert.equal(payload.sections.bests.status, 'ok');
  assert.equal(payload.sections.trend.status, 'ok');
  assert.equal(payload.profile.name, 'Xiaozhe');
  assert.equal(payload.cacheSeconds, DEGRADED_CACHE_SECONDS);
});

test('each upstream failure keeps its own status', async () => {
  const cases = [
    [401, 'unauthorized'],
    [403, 'forbidden'],
    [404, 'not_found'],
    [429, 'rate_limited'],
    [500, 'upstream_error'],
    [503, 'upstream_error']
  ];

  for (const [status, expected] of cases) {
    const { run } = build(okRoutes({
      [`/maimai/player/${FRIEND_CODE}/bests`]: () => jsonResponse({ success: false, code: status }, status)
    }));
    const payload = await run();
    assert.equal(payload.sections.bests.status, expected, `HTTP ${status}`);
    assert.equal(payload.bests, null);
    assert.equal(payload.profile.name, 'Xiaozhe', 'other sections stay usable');
  }
});

test('a business error inside a 200 envelope is classified by its code', async () => {
  const { run } = build(okRoutes({
    [`/maimai/player/${FRIEND_CODE}/trend`]: () => jsonResponse({ success: false, code: 403, message: 'no permission' })
  }));
  const payload = await run();
  assert.equal(payload.sections.trend.status, 'forbidden');
  assert.equal(payload.sections.profile.status, 'ok');
});

test('a timeout or a transport failure is reported without throwing', async () => {
  const timeout = Object.assign(new Error('timed out'), { name: 'TimeoutError' });
  const { run: runTimeout } = build(okRoutes({
    [`/maimai/player/${FRIEND_CODE}/recents`]: () => Promise.reject(timeout)
  }));
  const timedOut = await runTimeout();
  assert.equal(timedOut.sections.recents.status, 'timeout');
  assert.equal(timedOut.sections.profile.status, 'ok');

  const { run: runOffline } = build(okRoutes({
    [`/maimai/player/${FRIEND_CODE}`]: () => Promise.reject(new Error('socket hang up'))
  }));
  const offline = await runOffline();
  assert.equal(offline.sections.profile.status, 'unreachable');
  assert.equal(offline.profile, null);
  assert.equal(offline.sections.bests.status, 'ok');
});

// ── malformed and empty upstream data ───────────────────────────────────────

test('a non-JSON body and an unexpected payload never crash the archive', async () => {
  const html = () => new Response('<html>bad gateway</html>', { status: 502 });
  const { run } = build(okRoutes({ [`/maimai/player/${FRIEND_CODE}/bests`]: html }));
  const payload = await run();
  assert.equal(payload.sections.bests.status, 'upstream_error');
  assert.equal(payload.bests, null);

  // Valid JSON that is not the documented envelope.
  const { run: runArray } = build(okRoutes({ [`/maimai/player/${FRIEND_CODE}`]: () => jsonResponse([1, 2, 3]) }));
  const arrayPayload = await runArray();
  assert.equal(arrayPayload.sections.profile.status, 'invalid_response');
  assert.equal(arrayPayload.profile, null);

  // The envelope is there but the body does not match the object shape.
  const { run: runWrongShape } = build(okRoutes({
    [`/maimai/player/${FRIEND_CODE}/bests`]: () => jsonResponse(envelope({ unexpected: true }))
  }));
  const wrongShape = await runWrongShape();
  assert.equal(wrongShape.sections.bests.status, 'invalid_response');
  assert.equal(wrongShape.bests, null);
});

test('empty data becomes an explicit empty section, never invented content', async () => {
  const { run } = build(okRoutes({
    [`/maimai/player/${FRIEND_CODE}/trend`]: () => jsonResponse(envelope([])),
    [`/maimai/player/${FRIEND_CODE}/recents`]: () => jsonResponse(envelope([])),
    [`/maimai/player/${FRIEND_CODE}/bests`]: () => jsonResponse(envelope({ standard_total: 0, dx_total: 0, standard: [], dx: [] })),
    [`/maimai/player/${FRIEND_CODE}`]: () => jsonResponse(envelope(null))
  }));
  const payload = await run();

  assert.equal(payload.sections.trend.status, 'empty');
  assert.deepEqual(payload.trend, [], 'no placeholder curve is drawn for empty history');
  assert.equal(payload.sections.recents.status, 'empty');
  assert.deepEqual(payload.recents, []);
  assert.equal(payload.sections.bests.status, 'empty');
  assert.equal(payload.bests.total, 0, 'a real zero total is kept as data');
  assert.equal(payload.sections.profile.status, 'empty');
  assert.equal(payload.profile, null);
  assert.equal(payload.cacheSeconds, CACHE_SECONDS, 'empty but healthy results are cacheable');
});

// ── configuration ───────────────────────────────────────────────────────────

test('a missing configuration reports unconfigured and reads nothing', async () => {
  const stub = stubFetch(okRoutes());
  for (const options of [
    { apiKey: '', friendCode: FRIEND_CODE },
    { apiKey: API_KEY, friendCode: '' },
    { apiKey: undefined, friendCode: undefined }
  ]) {
    const payload = await buildMaimaiSummary({ ...options, fetchImpl: stub.fetchImpl });
    assert.equal(payload.configured, false);
    assert.equal(payload.cacheSeconds, 0);
    assert.equal(payload.profile, null);
    assert.equal(payload.bests, null);
    assert.equal(payload.trend, null);
    assert.equal(payload.recents, null);
    for (const key of ['profile', 'bests', 'trend', 'recents']) {
      assert.equal(payload.sections[key].status, 'unconfigured');
      assert.equal(payload.sections[key].count, 0);
    }
    expectNoSecrets(payload);
  }
  assert.equal(stub.calls.length, 0, 'an unconfigured deployment makes no upstream call');
});

test('a malformed friend code is rejected before any upstream call', async () => {
  const stub = stubFetch(okRoutes());
  const payload = await buildMaimaiSummary({ apiKey: API_KEY, friendCode: '12ab--', fetchImpl: stub.fetchImpl });
  assert.equal(payload.configured, true);
  assert.equal(payload.cacheSeconds, 0);
  assert.equal(payload.sections.profile.status, 'invalid_config');
  assert.equal(payload.profile, null);
  assert.equal(stub.calls.length, 0);
  assert.equal(FRIEND_CODE_PATTERN.test('12ab--'), false);
  assert.equal(FRIEND_CODE_PATTERN.test('123456789012'), true);
});

// ── mapping units ───────────────────────────────────────────────────────────

test('asset urls follow the documented paths and reject unusable ids', () => {
  assert.equal(assetUrl('jacket', 834), `${LXNS_ASSET_BASE}/jacket/834.png`);
  assert.equal(assetUrl('icon', 1), `${LXNS_ASSET_BASE}/icon/1.png`);
  assert.equal(assetUrl('plate', 12001), `${LXNS_ASSET_BASE}/plate/12001.png`);
  assert.equal(assetUrl('frame', 7), `${LXNS_ASSET_BASE}/frame/7.png`);
  assert.equal(assetUrl('jacket', 0), null);
  assert.equal(assetUrl('jacket', -3), null);
  assert.equal(assetUrl('jacket', null), null);
  assert.equal(assetUrl('jacket', 1.5), null);
});

test('a score row keeps unknown fields unknown', () => {
  const bare = mapScore({ id: 42, level_index: 0, achievements: 100, type: 'dx' });
  assert.equal(bare.songId, 42);
  assert.equal(bare.songName, null);
  assert.equal(bare.level, null);
  assert.equal(bare.rate, null);
  assert.equal(bare.dxRating, null);
  assert.equal(bare.playTime, null);
  assert.equal(bare.jacketUrl, `${LXNS_ASSET_BASE}/jacket/42.png`);

  assert.equal(mapScore(null), null);
  assert.equal(mapScore({}), null, 'a row without a song id is dropped');
  assert.equal(mapScore({ id: 0 }), null);
  assert.equal(mapScore({ id: 5, play_time: 'not a date' }).playTime, null);
});

test('the best 50 total is only reported when upstream reports a total', () => {
  assert.equal(mapBests({ standard: [], dx: [] }).total, null);
  assert.equal(mapBests({ standard_total: 100, standard: [], dx: [] }).total, 100);
  assert.equal(mapBests({ dx_total: 50, standard: [], dx: [] }).total, 50);
  assert.equal(mapBests({ standard_total: 100, dx_total: 50, standard: [], dx: [] }).total, 150);
  assert.equal(mapBests({ standard: [{ id: 1 }], dx: [] }).standard.length, 1);
  assert.equal(mapBests(null), null);
  assert.equal(mapBests('nope'), null);
});

test('the trend drops rows without a date or a total and keeps the order', () => {
  const points = mapTrend([
    { date: '2026-10-02', total: 100 },
    { total: 200 },
    { date: '2026-10-01', total: 50 },
    null
  ]);
  assert.equal(points.length, 2);
  assert.deepEqual(points.map((point) => point.date), ['2026-10-01', '2026-10-02']);
  assert.equal(mapTrend('nope'), null);
});

test('a section reader keeps an abort signal and unwraps the envelope', async () => {
  let seenSignal = null;
  const result = await readSection('/maimai/player/1', {
    apiKey: 'k',
    timeoutMs: 5000,
    fetchImpl: async (_url, init) => {
      seenSignal = init?.signal ?? null;
      return jsonResponse(envelope({ ok: true }));
    }
  });
  assert.equal(result.status, 'ok');
  assert.deepEqual(result.data, { ok: true });
  assert.ok(seenSignal instanceof AbortSignal);
});

// ── page wiring ─────────────────────────────────────────────────────────────

test('the status page renders the archive and never reaches for the key', () => {
  const page = readFileSync('src/routes/(site)/status/+page.svelte', 'utf8');
  assert.match(page, /MaimaiArchive/, 'the status page renders the maimai archive');
  assert.match(page, /maimai\.title|maimai\.section/, 'the archive section is labelled through i18n');

  const componentFiles = globSync('src/lib/features/maimai/*.svelte');
  assert.ok(componentFiles.length >= 4, 'the archive is split into small components');
  for (const file of componentFiles) {
    const source = readFileSync(file, 'utf8');
    assert.equal(/LXNS_DEVELOPER_API_KEY|MAIMAI_FRIEND_CODE/.test(source), false, `${file} must not know the secrets`);
    assert.equal(/upload_time|uploadedAt\s*\|\|\s*.*playTime|playTime\s*\|\|/.test(source), false, `${file} must not dress an upload time up as a play time`);
  }

  const chart = readFileSync('src/lib/features/maimai/MaimaiTrendChart.svelte', 'utf8');
  assert.match(chart, /<svg/, 'the trend chart is drawn with inline svg');

  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
  for (const banned of ['chart.js', 'echarts', 'apexcharts', 'd3', 'victory', 'layerchart']) {
    assert.equal(deps.includes(banned), false, `${banned} is not needed for one line chart`);
  }
});

test('every maimai string exists in both dictionaries', () => {
  const i18n = readFileSync('src/lib/i18n/index.ts', 'utf8');
  const enStart = i18n.indexOf('\n  en: {');
  assert.ok(enStart > 0, 'the english dictionary marks its start');
  const zhSource = i18n.slice(0, enStart);
  const enSource = i18n.slice(enStart);
  const keysOf = (source) => new Set([...source.matchAll(/'(maimai\.[a-zA-Z0-9_.]+)':/g)].map((match) => match[1]));
  const zh = keysOf(zhSource);
  const en = keysOf(enSource);

  const used = new Set();
  for (const file of globSync('src/lib/features/maimai/*.svelte').concat('src/routes/(site)/status/+page.svelte')) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(/t\('(maimai\.[a-zA-Z0-9_.]+)'\)/g)) used.add(match[1]);
    for (const match of source.matchAll(/'(maimai\.[a-zA-Z0-9_.]+)'/g)) {
      // A trailing dot is a dynamic prefix, covered by the explicit keys below.
      if (!match[1].endsWith('.')) used.add(match[1]);
    }
  }
  // Dynamic keys: chart types and the section statuses are looked up by suffix.
  for (const type of ['standard', 'dx', 'utage']) used.add('maimai.chartType.' + type);
  for (const status of [
    'ok', 'empty', 'unconfigured', 'invalid_config', 'unauthorized', 'forbidden',
    'not_found', 'rate_limited', 'unreachable', 'timeout', 'upstream_error', 'invalid_response'
  ]) {
    used.add(`maimai.status.${status}`);
  }

  assert.ok(used.size > 20, 'the archive uses a real set of strings');
  for (const key of used) {
    assert.ok(zh.has(key), `missing zh-CN string: ${key}`);
    assert.ok(en.has(key), `missing en string: ${key}`);
  }
  for (const key of zh) {
    assert.ok(en.has(key), `${key} is only translated into one language`);
  }
});
