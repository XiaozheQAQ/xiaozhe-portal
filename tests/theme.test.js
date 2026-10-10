// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import vm from 'node:vm';
import {
  THEME_STORAGE_KEY,
  nextTheme,
  parseStoredTheme,
  resolveRevealOrigin,
  resolveTheme,
  revealRadius
} from '../src/lib/theme/theme.ts';

const appHtml = readFileSync(new URL('../src/app.html', import.meta.url), 'utf8');
const appCss = readFileSync(new URL('../src/app.css', import.meta.url), 'utf8');
const header = readFileSync(new URL('../src/lib/components/layout/Header.svelte', import.meta.url), 'utf8');
const bootstrap = appHtml.match(/<script>([\s\S]*?)<\/script>/)?.[1] ?? '';

/**
 * Runs the real inline bootstrap from src/app.html against a stubbed DOM, so the
 * pre-paint script and the shared rules in src/lib/theme/theme.ts are checked
 * against each other instead of drifting apart in silence.
 */
function runBootstrap(stored, systemDark) {
  const store = new Map();
  if (stored !== undefined) store.set(THEME_STORAGE_KEY, stored);
  const written = [];
  const removed = [];
  const classes = new Set();
  const dataset = {};
  const context = {
    localStorage: {
      getItem: (key) => (store.has(key) ? store.get(key) : null),
      setItem: (key, value) => {
        written.push([key, value]);
        store.set(key, value);
      },
      removeItem: (key) => {
        removed.push(key);
        store.delete(key);
      }
    },
    matchMedia: () => ({ matches: systemDark }),
    document: {
      documentElement: {
        classList: {
          add: (name) => classes.add(name),
          toggle: (name, on) => (on ? classes.add(name) : classes.delete(name))
        },
        dataset
      }
    }
  };
  vm.runInNewContext(bootstrap, context);
  return { classes, dataset, removed, written, store };
}

test('src/app.html bootstraps the theme before the stylesheet and the app', () => {
  assert.ok(bootstrap.includes('localStorage'), 'expected an inline theme bootstrap');
  assert.ok(
    appHtml.indexOf('<script>') < appHtml.indexOf('%sveltekit.head%'),
    'the bootstrap must run before the head (and therefore before the first paint)'
  );
});

test('the pre-paint bootstrap and the shared rules agree on every input', () => {
  for (const stored of [undefined, '', 'light', 'dark', 'system', 'midnight', 'LIGHT']) {
    for (const systemDark of [true, false]) {
      const label = 'stored=' + JSON.stringify(stored) + ' systemDark=' + systemDark;
      const run = runBootstrap(stored, systemDark);
      const { preference, stale } = parseStoredTheme(stored ?? null);
      const expected = resolveTheme(preference, systemDark);

      assert.equal(run.dataset.theme, expected, 'data-theme for ' + label);
      assert.equal(run.classes.has('dark'), expected === 'dark', 'dark class for ' + label);
      assert.equal(run.dataset.themeSource, preference ? 'explicit' : 'system', 'source for ' + label);
      assert.equal(run.classes.has('theme-initializing'), true, 'transitions stay off until hydration for ' + label);
      assert.deepEqual(run.written, [], 'the inferred theme is never persisted for ' + label);
      assert.deepEqual(run.removed, stale ? [THEME_STORAGE_KEY] : [], 'stale cleanup for ' + label);
    }
  }
});

test('storage is tri-state: only light and dark are explicit choices', () => {
  assert.deepEqual(parseStoredTheme('light'), { preference: 'light', stale: false });
  assert.deepEqual(parseStoredTheme('dark'), { preference: 'dark', stale: false });
  assert.deepEqual(parseStoredTheme(null), { preference: null, stale: false });
  assert.deepEqual(parseStoredTheme(undefined), { preference: null, stale: false });
  // The legacy third option and anything unknown fall back to "ask the system".
  assert.deepEqual(parseStoredTheme('system'), { preference: null, stale: true });
  assert.deepEqual(parseStoredTheme(''), { preference: null, stale: true });
  assert.deepEqual(parseStoredTheme('midnight'), { preference: null, stale: true });
});

test('an explicit choice outranks the system, absence follows it', () => {
  assert.equal(resolveTheme('dark', false), 'dark');
  assert.equal(resolveTheme('light', true), 'light');
  assert.equal(resolveTheme(null, true), 'dark');
  assert.equal(resolveTheme(null, false), 'light');
});

test('the switch only ever flips between the two themes', () => {
  assert.equal(nextTheme('light'), 'dark');
  assert.equal(nextTheme('dark'), 'light');
});

test('the reveal radius always reaches every viewport corner', () => {
  const viewports = [[1440, 900], [390, 844], [768, 1024], [3440, 1440]];
  const origins = [[0, 0], [1, 1], [720, 120], [1439, 899], [200, 800], [195, 35], [1370, 34]];
  for (const [width, height] of viewports) {
    for (const [x, y] of origins) {
      const radius = revealRadius(x, y, width, height);
      for (const [cornerX, cornerY] of [[0, 0], [width, 0], [0, height], [width, height]]) {
        const distance = Math.hypot(cornerX - x, cornerY - y);
        assert.ok(distance <= radius + 1e-9, 'corner ' + cornerX + ',' + cornerY + ' uncovered from ' + x + ',' + y);
      }
    }
  }
});

/*
 * These two guards cover the flash the pre-paint script alone cannot fix: the
 * glyph of a font-display: swap face, and a theme icon that only becomes correct
 * once hydration runs.
 */
test('the icon font is preloaded and painted with font-display: block', () => {
  assert.ok(appHtml.includes('rel="preload"'), 'app.html must preload the icon font');
  assert.ok(appHtml.includes('/fonts/remixicon.woff2'));
  assert.ok(
    appHtml.indexOf('/fonts/remixicon.woff2') < appHtml.indexOf('%sveltekit.head%'),
    'the preload must precede the sveltekit head'
  );
  assert.ok(existsSync(new URL('../static/fonts/remixicon.woff2', import.meta.url)), 'the preloaded file must exist');

  const faces = appCss.match(/@font-face\s*\{[^}]*\}/g) ?? [];
  const blocking = faces.find((rule) => rule.includes('remixicon-preboot'));
  assert.ok(blocking, 'app.css must re-declare the icon face from the stable path');
  assert.match(blocking, /font-display:\s*block/);
  assert.match(
    appCss,
    /\[class\^="ri-"\],\s*\[class\*=" ri-"\]\s*\{\s*font-family:\s*"remixicon-preboot"\s*!important/
  );
});

test('both theme glyphs ship in the markup and the html class picks the visible one', () => {
  assert.ok(header.includes('theme-icon theme-icon-light ri-sun-line'));
  assert.ok(header.includes('theme-icon theme-icon-dark ri-moon-line'));
  assert.ok(!header.includes("dark ? 'ri-moon-line' : 'ri-sun-line'"), 'the glyph must not depend on hydrated state');
  assert.match(appCss, /\.theme-button \.theme-icon-dark\s*\{\s*display:\s*none/);
  assert.match(appCss, /html\.dark \.theme-button \.theme-icon-light\s*\{\s*display:\s*none/);
  assert.match(appCss, /html\.dark \.theme-button \.theme-icon-dark\s*\{\s*display:\s*inline-flex/);
});

test('pointer events reveal from the click, keyboard from the control centre', () => {
  const center = { x: 1370, y: 34 };
  assert.deepEqual(resolveRevealOrigin({ detail: 1, clientX: 1362, clientY: 20 }, center), { x: 1362, y: 20 });
  assert.deepEqual(resolveRevealOrigin({ detail: 0, clientX: 0, clientY: 0 }, center), center);
  assert.deepEqual(resolveRevealOrigin(null, center), center);
  assert.deepEqual(resolveRevealOrigin(undefined, center), center);
  assert.deepEqual(resolveRevealOrigin({ detail: 1 }, center), center);
});
