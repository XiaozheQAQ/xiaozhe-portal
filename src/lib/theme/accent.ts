/**
 * The site's primary colour, shared by the pre-paint script, the client and the
 * stylesheet. Every swatch is one hue with two lightness/chroma pairs:
 *
 *   light  the display accent (--accent): fills, tints, highlights. Free to be
 *          bright, which is why the yellow-greens use it to look like themselves
 *          in light mode instead of going olive.
 *   ink    the readable twin (--accent-ink): text, icons, borders and focus
 *          rings, solved by an OKLCh scan that holds 4.5:1 or better against
 *          both the page background and --accent-soft (tests/accent.test.js
 *          asserts that floor).
 *
 * Only hue and chroma move, so all 16 keep the same perceived lightness and stay
 * in tune with one another.
 *
 * This module is pure: no DOM, no storage access. src/app.html runs the same
 * rules inline before the first paint, and its id list is compared against
 * ACCENTS by the test suite so the two cannot drift apart.
 */
export const ACCENT_STORAGE_KEY = 'xiaozhe-accent';

/** What "no stored preference" means: the original blue-violet, unchanged. */
export const DEFAULT_ACCENT = 'brand';

export const ACCENTS = [
  { id: 'brand', hue: 266.4, light: { l: 0.509, c: 0.198 }, ink: { l: 0.509, c: 0.198 }, softC: 0.03, dark: { c: 0.138 } },
  { id: 'violet', hue: 288.9, light: { l: 0.555, c: 0.24 }, ink: { l: 0.555, c: 0.24 }, softC: 0.03, dark: { c: 0.113 } },
  { id: 'purple', hue: 311.4, light: { l: 0.56, c: 0.24 }, ink: { l: 0.56, c: 0.24 }, softC: 0.03, dark: { c: 0.147 } },
  { id: 'magenta', hue: 333.9, light: { l: 0.56, c: 0.238 }, ink: { l: 0.56, c: 0.238 }, softC: 0.03, dark: { c: 0.160 } },
  { id: 'rose', hue: 356.4, light: { l: 0.555, c: 0.216 }, ink: { l: 0.555, c: 0.216 }, softC: 0.03, dark: { c: 0.137 } },
  { id: 'red', hue: 18.9, light: { l: 0.552, c: 0.211 }, ink: { l: 0.552, c: 0.211 }, softC: 0.03, dark: { c: 0.122 } },
  { id: 'orange', hue: 41.4, light: { l: 0.542, c: 0.157 }, ink: { l: 0.542, c: 0.157 }, softC: 0.03, dark: { c: 0.127 } },
  { id: 'amber', hue: 63.9, light: { l: 0.537, c: 0.116 }, ink: { l: 0.537, c: 0.116 }, softC: 0.03, dark: { c: 0.157 } },
  { id: 'lime', hue: 86.4, light: { l: 0.8, c: 0.164 }, ink: { l: 0.53, c: 0.109 }, softC: 0.055, dark: { c: 0.152 } },
  { id: 'green', hue: 108.9, light: { l: 0.8, c: 0.174 }, ink: { l: 0.53, c: 0.115 }, softC: 0.055, dark: { c: 0.160 } },
  { id: 'emerald', hue: 131.4, light: { l: 0.8, c: 0.22 }, ink: { l: 0.523, c: 0.144 }, softC: 0.055, dark: { c: 0.160 } },
  { id: 'teal', hue: 153.9, light: { l: 0.517, c: 0.124 }, ink: { l: 0.517, c: 0.124 }, softC: 0.03, dark: { c: 0.160 } },
  { id: 'cyan', hue: 176.4, light: { l: 0.522, c: 0.093 }, ink: { l: 0.522, c: 0.093 }, softC: 0.03, dark: { c: 0.138 } },
  { id: 'sky', hue: 198.9, light: { l: 0.522, c: 0.084 }, ink: { l: 0.522, c: 0.084 }, softC: 0.03, dark: { c: 0.126 } },
  { id: 'blue', hue: 221.4, light: { l: 0.525, c: 0.092 }, ink: { l: 0.525, c: 0.092 }, softC: 0.03, dark: { c: 0.136 } },
  { id: 'indigo', hue: 243.9, light: { l: 0.527, c: 0.123 }, ink: { l: 0.527, c: 0.123 }, softC: 0.03, dark: { c: 0.115 } },
] as const;

export type AccentId = (typeof ACCENTS)[number]['id'];
export type AccentOption = (typeof ACCENTS)[number];

export const ACCENT_IDS: readonly AccentId[] = ACCENTS.map((accent) => accent.id);

const BY_ID = new Map<string, AccentOption>(ACCENTS.map((accent) => [accent.id, accent]));

export function isAccentId(value: unknown): value is AccentId {
  return typeof value === 'string' && BY_ID.has(value);
}

export function accentById(id: AccentId): AccentOption {
  return BY_ID.get(id) as AccentOption;
}

/**
 * Absence means the default. Anything unrecognised is reported as stale so the
 * caller can drop it — the same contract the theme preference uses.
 */
export function parseStoredAccent(raw: string | null): { accent: AccentId | null; stale: boolean } {
  if (raw === null) return { accent: null, stale: false };
  return isAccentId(raw) ? { accent: raw, stale: false } : { accent: null, stale: true };
}

/** Every swatch is named by an i18n key, so both dictionaries must carry it. */
export function accentLabelKey(id: AccentId): string {
  return `accent.${id}`;
}

/**
 * The colour of a palette chip. It uses the dark-mode chroma in both themes: a
 * palette should read as vivid, and the chip is decoration, not text.
 */
export function swatchColor(accent: AccentOption): string {
  return `oklch(0.63 ${accent.dark.c} ${accent.hue})`;
}
