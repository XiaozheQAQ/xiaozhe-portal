import type {
  MaimaiBests,
  MaimaiCollection,
  MaimaiProfile,
  MaimaiScore,
  MaimaiSectionKey,
  MaimaiSectionState,
  MaimaiSectionStatus,
  MaimaiSummary,
  MaimaiTrendPoint
} from '#lib/maimai/types';

/**
 * Reads the public maimai DX archive from the LXNS 落雪查分器 developer API and
 * maps it onto the contract in `#lib/maimai/types`.
 *
 * The four upstream reads are independent: they run concurrently and each one
 * keeps its own status, so an unavailable "recents" read never blanks out the
 * player's Best 50. Nothing here is fabricated — a section that upstream cannot
 * serve reports a status and stays null, and the page says so.
 *
 * The API key is only ever read from the environment by the route that calls
 * this module; it is attached to the upstream request header and is never part
 * of the returned payload.
 *
 * This module deliberately has no runtime imports of other project modules: the
 * Node test suite imports it directly and only erases the type-only import
 * above.
 */

/** Documented base URL — request paths below are appended to it verbatim. */
export const LXNS_API_BASE = 'https://maimai.lxns.net/api/v0';
/** Documented asset host: /icon, /plate, /frame and /jacket live under it. */
export const LXNS_ASSET_BASE = 'https://assets2.lxns.net/maimai';
/** Per-request deadline so a hung upstream cannot stall the page. */
export const UPSTREAM_TIMEOUT_MS = 7000;
/** Cache-Control lifetime when every section came back healthy (~5 minutes). */
export const CACHE_SECONDS = 300;
/** Shorter lifetime while the archive is degraded, so it recovers quickly. */
export const DEGRADED_CACHE_SECONDS = 60;
/** Friend codes are 12 digits today; the range leaves room without allowing junk. */
export const FRIEND_CODE_PATTERN = /^\d{8,20}$/;

const TEXT_MAX_LENGTH = 160;
const CODE_MAX_LENGTH = 16;

export type MaimaiFetch = (input: string, init?: RequestInit) => Promise<Response>;

export type MaimaiSummaryOptions = {
  apiKey?: string | null;
  friendCode?: string | null;
  /** Injected so the route can pass SvelteKit's fetch and tests can pass a stub. */
  fetchImpl: MaimaiFetch;
  timeoutMs?: number;
  now?: () => Date;
};

type SectionResult<T> = { status: MaimaiSectionStatus; data: T | null };

/** The documented envelope: `{ success, code, message?, data? }`. */
type Envelope = { success?: unknown; code?: unknown; message?: unknown; data?: unknown };

const SECTION_KEYS: readonly MaimaiSectionKey[] = ['profile', 'bests', 'trend', 'recents'];

// ── coercion ────────────────────────────────────────────────────────────────

function toRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function toText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text && text.length <= TEXT_MAX_LENGTH ? text : null;
}

/** Enum codes are lowercase single tokens; anything else is treated as absent. */
function toCode(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const code = value.trim().toLowerCase();
  if (!code || code.length > CODE_MAX_LENGTH || !/^[a-z0-9_]+$/.test(code)) return null;
  return code;
}

function toInt(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.trunc(value);
}

function toNumber(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return value;
}

/** Keeps the upstream UTC timestamp when it parses; drops anything else. */
function toIso(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const date = new Date(value.trim());
  if (Number.isNaN(date.getTime())) return null;
  return value.trim();
}

function toScoreList(value: unknown): MaimaiScore[] | null {
  if (!Array.isArray(value)) return null;
  const scores: MaimaiScore[] = [];
  for (const entry of value) {
    const score = mapScore(entry);
    if (score) scores.push(score);
  }
  return scores;
}

// ── mapping upstream objects onto the public contract ───────────────────────

/** Documented asset path rules: `{host}/{kind}/{id}.png`. */
export function assetUrl(kind: 'icon' | 'plate' | 'frame' | 'jacket', id: number | null): string | null {
  if (id === null || !Number.isInteger(id) || id <= 0) return null;
  return `${LXNS_ASSET_BASE}/${kind}/${id}.png`;
}

export function mapCollection(value: unknown): MaimaiCollection | null {
  const record = toRecord(value);
  if (!record) return null;
  const id = toInt(record.id);
  if (id === null) return null;
  return {
    id,
    name: toText(record.name),
    color: toCode(record.color),
    genre: toText(record.genre)
  };
}

export function mapProfile(value: unknown): MaimaiProfile | null {
  const record = toRecord(value);
  if (!record) return null;
  const name = toText(record.name);
  const rating = toInt(record.rating);
  if (!name || rating === null) return null;

  const icon = mapCollection(record.icon);
  const namePlate = mapCollection(record.name_plate);
  const frame = mapCollection(record.frame);

  return {
    name,
    rating,
    courseRank: toInt(record.course_rank),
    classRank: toInt(record.class_rank),
    star: toInt(record.star),
    trophy: mapCollection(record.trophy),
    icon,
    iconUrl: assetUrl('icon', icon?.id ?? null),
    namePlateUrl: assetUrl('plate', namePlate?.id ?? null),
    frameUrl: assetUrl('frame', frame?.id ?? null),
    syncedAt: toIso(record.upload_time)
  };
}

export function mapScore(value: unknown): MaimaiScore | null {
  const record = toRecord(value);
  if (!record) return null;
  const songId = toInt(record.id);
  if (songId === null || songId <= 0) return null;

  return {
    songId,
    songName: toText(record.song_name),
    level: toText(record.level),
    levelIndex: toInt(record.level_index),
    chartType: toCode(record.type),
    achievements: toNumber(record.achievements),
    rate: toCode(record.rate),
    dxScore: toInt(record.dx_score),
    dxStar: toInt(record.dx_star),
    dxRating: toNumber(record.dx_rating),
    combo: toCode(record.fc),
    sync: toCode(record.fs),
    jacketUrl: assetUrl('jacket', songId),
    playTime: toIso(record.play_time),
    lastPlayedTime: toIso(record.last_played_time),
    uploadedAt: toIso(record.upload_time)
  };
}

export function mapBests(value: unknown): MaimaiBests | null {
  const record = toRecord(value);
  if (!record) return null;
  const standard = toScoreList(record.standard);
  const dx = toScoreList(record.dx);
  if (standard === null && dx === null) return null;

  const standardTotal = toInt(record.standard_total);
  const dxTotal = toInt(record.dx_total);
  const hasTotals = standardTotal !== null || dxTotal !== null;

  return {
    standardTotal,
    dxTotal,
    // Sum of the totals upstream reported; null when it reported neither, so the
    // page never invents a combined figure.
    total: hasTotals ? (standardTotal ?? 0) + (dxTotal ?? 0) : null,
    standard: standard ?? [],
    dx: dx ?? []
  };
}

export function mapTrend(value: unknown): MaimaiTrendPoint[] | null {
  if (!Array.isArray(value)) return null;
  const points: MaimaiTrendPoint[] = [];
  for (const entry of value) {
    const record = toRecord(entry);
    if (!record) continue;
    const date = toText(record.date);
    const total = toInt(record.total);
    if (!date || total === null) continue;
    points.push({ date, total, standard: toInt(record.standard), dx: toInt(record.dx) });
  }
  // Oldest first, so a chart can plot the series left to right.
  return points.sort((a, b) => a.date.localeCompare(b.date));
}

export function mapRecents(value: unknown): MaimaiScore[] | null {
  // Upstream already orders recents by play_time; the order is preserved.
  return toScoreList(value);
}

// ── upstream reads ──────────────────────────────────────────────────────────

function classifyHttpStatus(status: number): MaimaiSectionStatus {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status === 429) return 'rate_limited';
  if (status >= 200 && status < 300) return 'invalid_response';
  return 'upstream_error';
}

/** Reads one documented endpoint and unwraps the shared response envelope. */
export async function readSection<T>(
  path: string,
  options: { apiKey: string; fetchImpl: MaimaiFetch; timeoutMs: number }
): Promise<SectionResult<T>> {
  let response: Response;
  try {
    response = await options.fetchImpl(`${LXNS_API_BASE}${path}`, {
      headers: { authorization: options.apiKey, accept: 'application/json' },
      signal: AbortSignal.timeout(options.timeoutMs)
    });
  } catch (error) {
    const name = (error as { name?: string } | null)?.name;
    return { status: name === 'TimeoutError' || name === 'AbortError' ? 'timeout' : 'unreachable', data: null };
  }

  let payload: unknown;
  try {
    payload = JSON.parse(await response.text());
  } catch {
    // A proxy error page is not the documented envelope: report the HTTP status.
    return { status: classifyHttpStatus(response.status), data: null };
  }

  const envelope = toRecord(payload) as Envelope | null;
  if (!envelope || typeof envelope.success !== 'boolean') {
    return { status: classifyHttpStatus(response.status), data: null };
  }

  if (!envelope.success) {
    // Business errors carry their own code; HTTP may still be 200.
    const code = toInt(envelope.code) ?? response.status;
    return { status: classifyHttpStatus(code), data: null };
  }

  if (envelope.data === null || envelope.data === undefined) {
    return { status: 'empty', data: null };
  }

  return { status: 'ok', data: envelope.data as T };
}

function sectionState(status: MaimaiSectionStatus, count: number): MaimaiSectionState {
  return { status, count: status === 'ok' || status === 'empty' ? count : 0 };
}

function emptySections(status: MaimaiSectionStatus): Record<MaimaiSectionKey, MaimaiSectionState> {
  return Object.fromEntries(SECTION_KEYS.map((key) => [key, sectionState(status, 0)])) as Record<
    MaimaiSectionKey,
    MaimaiSectionState
  >;
}

// ── composition ─────────────────────────────────────────────────────────────

/**
 * Builds the public archive payload.
 *
 * Statuses are decided per section: an upstream failure is reported as-is, a
 * successful but empty read becomes `empty`, and data that does not match the
 * documented shape becomes `invalid_response` instead of a blank section.
 */
export async function buildMaimaiSummary(options: MaimaiSummaryOptions): Promise<MaimaiSummary> {
  const apiKey = typeof options.apiKey === 'string' ? options.apiKey.trim() : '';
  const friendCode = typeof options.friendCode === 'string' ? options.friendCode.trim() : '';
  const now = options.now ?? (() => new Date());
  const generatedAt = now().toISOString();

  const unconfigured: MaimaiSummary = {
    configured: false,
    cacheSeconds: 0,
    generatedAt,
    source: 'lxns',
    sections: emptySections('unconfigured'),
    profile: null,
    bests: null,
    trend: null,
    recents: null
  };

  // No fallback data: without both variables the page shows "data pending".
  if (!apiKey || !friendCode) return unconfigured;

  if (!FRIEND_CODE_PATTERN.test(friendCode)) {
    return { ...unconfigured, configured: true, sections: emptySections('invalid_config') };
  }

  const readOptions = {
    apiKey,
    fetchImpl: options.fetchImpl,
    timeoutMs: options.timeoutMs ?? UPSTREAM_TIMEOUT_MS
  };
  const code = encodeURIComponent(friendCode);

  // Four independent reads in flight together, each keeping its own outcome.
  const [profileRead, bestsRead, trendRead, recentsRead] = await Promise.all([
    readSection<unknown>(`/maimai/player/${code}`, readOptions),
    readSection<unknown>(`/maimai/player/${code}/bests`, readOptions),
    readSection<unknown>(`/maimai/player/${code}/trend`, readOptions),
    readSection<unknown>(`/maimai/player/${code}/recents`, readOptions)
  ]);

  const profile =
    profileRead.status === 'ok' || profileRead.status === 'empty' ? mapProfile(profileRead.data) : null;
  const profileStatus: MaimaiSectionStatus =
    profileRead.status === 'ok' ? (profile ? 'ok' : 'invalid_response') : profileRead.status;

  const bests =
    bestsRead.status === 'ok' || bestsRead.status === 'empty' ? mapBests(bestsRead.data) : null;
  const bestCount = bests ? bests.standard.length + bests.dx.length : 0;
  const bestsStatus: MaimaiSectionStatus =
    bestsRead.status !== 'ok' ? bestsRead.status : !bests ? 'invalid_response' : bestCount === 0 ? 'empty' : 'ok';

  // null means the section could not be read; [] means upstream had nothing yet.
  const trend = trendRead.status === 'ok' ? mapTrend(trendRead.data) : null;
  const trendStatus: MaimaiSectionStatus =
    trendRead.status !== 'ok'
      ? trendRead.status
      : trend === null
        ? 'invalid_response'
        : trend.length > 0
          ? 'ok'
          : 'empty';

  const recents = recentsRead.status === 'ok' ? mapRecents(recentsRead.data) : null;
  const recentsStatus: MaimaiSectionStatus =
    recentsRead.status !== 'ok'
      ? recentsRead.status
      : recents === null
        ? 'invalid_response'
        : recents.length > 0
          ? 'ok'
          : 'empty';

  const sections: Record<MaimaiSectionKey, MaimaiSectionState> = {
    profile: sectionState(profileStatus, profile ? 1 : 0),
    bests: sectionState(bestsStatus, bestCount),
    trend: sectionState(trendStatus, trend?.length ?? 0),
    recents: sectionState(recentsStatus, recents?.length ?? 0)
  };

  const healthy = SECTION_KEYS.every((key) => sections[key].status === 'ok' || sections[key].status === 'empty');

  return {
    configured: true,
    cacheSeconds: healthy ? CACHE_SECONDS : DEGRADED_CACHE_SECONDS,
    generatedAt,
    source: 'lxns',
    sections,
    profile,
    bests,
    trend,
    recents
  };
}
