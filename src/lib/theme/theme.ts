/**
 * Theme rules shared by the pre-paint bootstrap in src/app.html, the site layout
 * and the tests. Nothing here touches the DOM, so it can be exercised in Node.
 *
 * Storage is deliberately tri-state: the key either holds an explicit choice
 * ('light' | 'dark') or it holds nothing at all. "Follow the system" is the
 * absence of a value, never a stored one — that is what keeps an inferred theme
 * from freezing a visitor into a mode they never picked.
 */
export const THEME_STORAGE_KEY = 'xiaozhe-theme';

/** The two themes a visitor can pick. */
export type ThemeName = 'light' | 'dark';

/** null means "no explicit choice": keep following the system. */
export type ThemePreference = ThemeName | null;

export type ParsedTheme = {
  /** The explicit choice, or null when the visitor never made one. */
  preference: ThemePreference;
  /** True for the legacy 'system' value and for anything unrecognised. */
  stale: boolean;
};

/**
 * Normalises a raw localStorage value. The legacy three-way 'system' collapses
 * into "no explicit choice", and unknown values are reported as stale so the
 * caller can drop them instead of trusting them.
 */
export function parseStoredTheme(raw: unknown): ParsedTheme {
  if (raw === 'light' || raw === 'dark') return { preference: raw, stale: false };
  if (raw === null || raw === undefined) return { preference: null, stale: false };
  return { preference: null, stale: true };
}

/** The theme actually shown: the explicit choice wins, otherwise the system decides. */
export function resolveTheme(preference: ThemePreference, systemPrefersDark: boolean): ThemeName {
  if (preference) return preference;
  return systemPrefersDark ? 'dark' : 'light';
}

/** The other of the two themes. */
export function nextTheme(current: ThemeName): ThemeName {
  return current === 'dark' ? 'light' : 'dark';
}

/** Distance from the reveal centre to the farthest viewport corner. */
export function revealRadius(x: number, y: number, width: number, height: number): number {
  return Math.hypot(Math.max(x, width - x), Math.max(y, height - y));
}

export type RevealOrigin = { x: number; y: number };

/**
 * Keyboard activation carries no pointer position (MouseEvent.detail === 0), so
 * the reveal starts from the centre of the control that was activated instead.
 */
export function resolveRevealOrigin(
  event: { detail?: number; clientX?: number; clientY?: number } | null | undefined,
  fallbackCenter: RevealOrigin
): RevealOrigin {
  const isPointer =
    !!event && (event.detail ?? 0) > 0 && Number.isFinite(event.clientX) && Number.isFinite(event.clientY);
  return isPointer ? { x: event.clientX as number, y: event.clientY as number } : fallbackCenter;
}
