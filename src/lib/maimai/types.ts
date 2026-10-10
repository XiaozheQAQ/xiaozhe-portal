/**
 * Public shape of the maimai DX archive served by /api/maimai/summary.
 *
 * This is display data only: no friend code, no API key, no upstream envelope
 * and no server configuration. The page reads exactly this contract, so it can
 * render a partial archive — one upstream read failing never hides the others.
 *
 * The upstream API documents several score fields as optional depending on the
 * endpoint that returned them (for example `song_name` and `rate` are only
 * documented for single-score reads, while `play_time` may be null). Those
 * fields are typed as nullable here and the UI omits them instead of guessing.
 */

/** Section keys, in the order the status page renders them. */
export type MaimaiSectionKey = 'profile' | 'bests' | 'trend' | 'recents';

/**
 * Per-section outcome. `ok` and `empty` are healthy results; every other value
 * is a distinct failure so the page can explain what happened instead of
 * collapsing everything into one error message.
 *
 * - `unconfigured`   — the deployment has no API key / friend code yet
 * - `invalid_config` — the environment variables exist but the friend code is malformed
 * - `unauthorized`   — 401, the key was rejected
 * - `forbidden`      — 403, the key lacks the permission this endpoint needs
 * - `not_found`      — 404, the friend code has no player on LXNS
 * - `rate_limited`   — 429, upstream throttling
 * - `unreachable`    — the request never produced a response
 * - `timeout`        — the request exceeded the configured deadline
 * - `upstream_error` — any other upstream HTTP status
 * - `invalid_response` — the response was not the documented JSON envelope
 */
export type MaimaiSectionStatus =
  | 'ok'
  | 'empty'
  | 'unconfigured'
  | 'invalid_config'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'rate_limited'
  | 'unreachable'
  | 'timeout'
  | 'upstream_error'
  | 'invalid_response';

export type MaimaiSectionState = {
  status: MaimaiSectionStatus;
  /** Number of records in the section (0 whenever the section is unavailable). */
  count: number;
};

/**
 * A collected item (avatar, name plate, background frame or trophy).
 *
 * The API models all of them as a collection entry; the guide's own example
 * shows only `id`, `name`, `genre` and `color` populated for a trophy.
 */
export type MaimaiCollection = {
  id: number;
  name: string | null;
  /** Only trophies carry a colour. */
  color: string | null;
  genre: string | null;
};

export type MaimaiProfile = {
  /** In-game name. */
  name: string;
  /** DX Rating. */
  rating: number;
  courseRank: number | null;
  classRank: number | null;
  /** Number of awakened partners. */
  star: number | null;
  trophy: MaimaiCollection | null;
  icon: MaimaiCollection | null;
  /** Ready-to-use asset URLs, or null when the player hides that item. */
  iconUrl: string | null;
  namePlateUrl: string | null;
  frameUrl: string | null;
  /** When LXNS last synced this player (UTC ISO string). */
  syncedAt: string | null;
};

/**
 * One score row, shared by Best 50 and the recent plays.
 *
 * `playTime` is the real play time and may be null. `lastPlayedTime` and
 * `uploadedAt` are kept apart from it: the upload time is when the score was
 * synced, never the time it was played, and the UI labels them differently.
 */
export type MaimaiScore = {
  /** Song id, also the key for the jacket asset. */
  songId: number;
  songName: string | null;
  /** Difficulty level such as `14+`. */
  level: string | null;
  /** LevelIndex: 0 BASIC … 4 Re:MASTER. */
  levelIndex: number | null;
  /** SongType: `standard` | `dx` | `utage`. */
  chartType: string | null;
  /** Achievement rate in percent, e.g. 100.7895. */
  achievements: number | null;
  /** RateType, e.g. `sssp`. */
  rate: string | null;
  dxScore: number | null;
  dxStar: number | null;
  /** DX Rating contribution; the docs ask for a floor before display. */
  dxRating: number | null;
  /** FCType, e.g. `ap`. */
  combo: string | null;
  /** FSType, e.g. `fsd`. */
  sync: string | null;
  jacketUrl: string | null;
  /** Real play time (UTC ISO string, minute precision) — null when unknown. */
  playTime: string | null;
  /** Last time this chart was played, when the endpoint reports it. */
  lastPlayedTime: string | null;
  /** Sync time — never displayed as a play time. */
  uploadedAt: string | null;
};

export type MaimaiBests = {
  /** `standard_total`: Best 35 total of the older charts. */
  standardTotal: number | null;
  /** `dx_total`: Best 15 total of the current charts. */
  dxTotal: number | null;
  /** standard_total + dx_total, both taken from the API's own totals. */
  total: number | null;
  standard: MaimaiScore[];
  dx: MaimaiScore[];
};

export type MaimaiTrendPoint = {
  /** `YYYY-MM-DD`. */
  date: string;
  total: number;
  standard: number | null;
  dx: number | null;
};

export type MaimaiSummary = {
  /** False when the deployment has no API key or friend code yet. */
  configured: boolean;
  /** Suggested response cache lifetime in seconds; 0 means do not cache. */
  cacheSeconds: number;
  /** When this payload was assembled (UTC ISO string). */
  generatedAt: string;
  /** Upstream data source, so the page can name it. */
  source: 'lxns';
  sections: Record<MaimaiSectionKey, MaimaiSectionState>;
  profile: MaimaiProfile | null;
  bests: MaimaiBests | null;
  trend: MaimaiTrendPoint[] | null;
  recents: MaimaiScore[] | null;
};
