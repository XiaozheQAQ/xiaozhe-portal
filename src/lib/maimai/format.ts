/**
 * Display helpers for the maimai DX archive.
 *
 * Grade notation (`SSS+`, `AP`, `FDX`) is the game's own wording and reads the
 * same in both locales, so those tables live here. Anything that is a real word
 * goes through i18n instead.
 *
 * Every helper tolerates a missing value: a score field the upstream endpoint
 * does not return renders as "unknown" in the UI rather than as a guess.
 */

/** `LevelIndex` in the API's own order. */
export const MAIMAI_DIFFICULTIES = ['BASIC', 'ADVANCED', 'EXPERT', 'MASTER', 'Re:MASTER'] as const;

/** The game's venue is Asia/Tokyo; the archive is shown in the portal's zone. */
export const MAIMAI_TIME_ZONE = 'Asia/Shanghai';

/** Longest enum code the API can return; used to reject unexpected payloads. */
const CODE_MAX_LENGTH = 16;

const RATE_LABELS: Record<string, string> = {
  sssp: 'SSS+',
  sss: 'SSS',
  ssp: 'SS+',
  ss: 'SS',
  sp: 'S+',
  s: 'S',
  aaa: 'AAA',
  aa: 'AA',
  a: 'A',
  bbb: 'BBB',
  bb: 'BB',
  b: 'B',
  c: 'C',
  d: 'D'
};

const COMBO_LABELS: Record<string, string> = {
  app: 'AP+',
  ap: 'AP',
  fcp: 'FC+',
  fc: 'FC'
};

const SYNC_LABELS: Record<string, string> = {
  fsdp: 'FDX+',
  fsd: 'FDX',
  fsp: 'FS+',
  fs: 'FS',
  sync: 'SYNC'
};

/** Enum codes are lowercase single tokens; anything else is treated as absent. */
function normalizeCode(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const code = value.trim().toLowerCase();
  if (!code || code.length > CODE_MAX_LENGTH || !/^[a-z0-9_]+$/.test(code)) return null;
  return code;
}

function labelFrom(table: Record<string, string>, value: string | null | undefined): string | null {
  const code = normalizeCode(value);
  if (!code) return null;
  // An enum the docs did not list is still shown, upper-cased, rather than hidden.
  return table[code] ?? code.toUpperCase();
}

/** `3` -> `MASTER`. Unknown indexes return null so the UI can omit the chip. */
export function difficultyLabel(levelIndex: number | null | undefined): string | null {
  if (typeof levelIndex !== 'number' || !Number.isInteger(levelIndex)) return null;
  return MAIMAI_DIFFICULTIES[levelIndex] ?? null;
}

/**
 * maimai's own difficulty colours are applied by the stylesheet; this maps the
 * API's values onto the six chips it defines.
 *
 * UTAGE is a chart *type* rather than a level index, so it wins over
 * `level_index`: an utage chart is pink whichever slot the API fills in.
 */
export const MAIMAI_DIFFICULTY_TONES = ['basic', 'advanced', 'expert', 'master', 'remaster'] as const;

export type MaimaiDifficultyTone = (typeof MAIMAI_DIFFICULTY_TONES)[number] | 'utage';

/** Returns null for an unknown level index so the UI shows a neutral chip. */
export function difficultyTone(
  levelIndex: number | null | undefined,
  chartType: string | null | undefined
): MaimaiDifficultyTone | null {
  if (typeof chartType === 'string' && chartType.trim().toLowerCase() === 'utage') return 'utage';
  if (typeof levelIndex !== 'number' || !Number.isInteger(levelIndex)) return null;
  return MAIMAI_DIFFICULTY_TONES[levelIndex] ?? null;
}

export function rateLabel(rate: string | null | undefined): string | null {
  return labelFrom(RATE_LABELS, rate);
}

export function comboLabel(combo: string | null | undefined): string | null {
  return labelFrom(COMBO_LABELS, combo);
}

export function syncLabel(sync: string | null | undefined): string | null {
  return labelFrom(SYNC_LABELS, sync);
}

/** Achievement rate with the trailing zeros of the documented 4 decimals removed. */
export function formatAchievement(value: number | null | undefined): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const fixed = value.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
  return `${fixed}%`;
}

/** Integer DX Rating, optionally floored — the docs floor `dx_rating` on display. */
export function formatDxRating(value: number | null | undefined, floor = true): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return floor ? Math.floor(value) : Math.round(value);
}

/** Thousands-separated integers for ratings and scores. */
export function formatNumber(value: number | null | undefined): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.round(value).toLocaleString('en-US');
}

/** `2026-10-10` -> `10-10`, used for compact chart axis labels. */
export function shortDateLabel(date: string | null | undefined): string | null {
  if (typeof date !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  if (!match) return null;
  return `${match[2]}-${match[3]}`;
}

/**
 * Formats a UTC ISO timestamp in the archive time zone.
 * Returns null for a missing or malformed value so the caller can say "unknown".
 */
export function formatTimestamp(value: string | null | undefined, locale: string): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale === 'zh-CN' ? 'zh-CN' : 'en-US', {
    timeZone: MAIMAI_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    hourCycle: 'h23'
  }).format(date);
}
