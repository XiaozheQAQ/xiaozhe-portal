// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import {
  ACCENTS,
  ACCENT_IDS,
  ACCENT_STORAGE_KEY,
  DEFAULT_ACCENT,
  accentById,
  accentLabelKey,
  isAccentId,
  parseStoredAccent,
  swatchColor
} from '../src/lib/theme/accent.ts';

const appHtml = readFileSync(new URL('../src/app.html', import.meta.url), 'utf8');
const appCss = readFileSync(new URL('../src/app.css', import.meta.url), 'utf8');
const header = readFileSync(new URL('../src/lib/components/layout/Header.svelte', import.meta.url), 'utf8');
const layout = readFileSync(new URL('../src/routes/(site)/+layout.svelte', import.meta.url), 'utf8');
const i18nSource = readFileSync(new URL('../src/lib/i18n/index.ts', import.meta.url), 'utf8');
const bootstrap = appHtml.match(/<script>([\s\S]*?)<\/script>/)?.[1] ?? '';
/* Every file that paints with the accent, so the legibility rule is checked
   where it matters rather than in the stylesheet alone. */
const accentSurfaces = [
  appCss,
  header,
  layout,
  readFileSync(new URL('../src/lib/features/lab/LabItem.svelte', import.meta.url), 'utf8'),
  readFileSync(new URL('../src/lib/features/blog/PostItem.svelte', import.meta.url), 'utf8'),
  readFileSync(new URL('../src/routes/(site)/search/+page.svelte', import.meta.url), 'utf8'),
  readFileSync(new URL('../src/routes/(site)/lab/+page.svelte', import.meta.url), 'utf8'),
  readFileSync(new URL('../src/routes/(site)/lab/[slug]/+page.svelte', import.meta.url), 'utf8'),
  readFileSync(new URL('../src/routes/(site)/blog/[slug]/+page.svelte', import.meta.url), 'utf8')
];

/* ------------------------------------------------------------------ colour */

const srgbToLinear = (c) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const linearToSrgb = (c) => {
  const v = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
  return Math.max(0, Math.min(1, v)) * 255;
};
const oklabToLinear = (L, a, b) => {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  ];
};
/** Independent implementation of what the stylesheet asks the browser to do. */
const oklchToRgb = (L, C, hue) => {
  const rad = (hue * Math.PI) / 180;
  return oklabToLinear(L, C * Math.cos(rad), C * Math.sin(rad)).map(linearToSrgb);
};
const luminance = (rgb) =>
  0.2126 * srgbToLinear(rgb[0]) + 0.7152 * srgbToLinear(rgb[1]) + 0.0722 * srgbToLinear(rgb[2]);
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const BG = { light: hexToRgb('#fafbfc'), dark: hexToRgb('#0d1016') };

const swatchRows = new Map();
for (const match of appCss.matchAll(/\[data-accent="([a-z]+)"\]\s*\{([^}]*)\}/g)) {
  const vars = Object.fromEntries(
    [...match[2].matchAll(/--([a-z-]+):\s*([^;]+);/g)].map((entry) => [entry[1], entry[2].trim()])
  );
  if (vars['accent-h']) swatchRows.set(match[1], vars);
}

/* ---------------------------------------------------------------- the data */

test('the palette is one harmonious ring of 16 named colours', () => {
  assert.equal(ACCENTS.length, 16, 'the palette is expected to hold 16 colours');
  assert.equal(new Set(ACCENT_IDS).size, 16, 'ids must be unique');
  assert.equal(ACCENT_IDS[0], DEFAULT_ACCENT, 'the first swatch is the colour "no preference" means');
  const hues = ACCENTS.map((accent) => accent.hue);
  assert.equal(new Set(hues).size, 16, 'no two swatches may share a hue');
  for (let i = 1; i < hues.length; i += 1) {
    const step = (hues[i] - hues[i - 1] + 360) % 360;
    assert.ok(Math.abs(step - 22.5) < 0.05, 'swatch ' + i + ' is ' + step.toFixed(2) + '° from the previous one');
  }
});

test('every swatch id has a name in both dictionaries', () => {
  for (const id of ACCENT_IDS) {
    const key = accentLabelKey(id);
    assert.equal(key, 'accent.' + id);
    const hits = i18nSource.split("'" + key + "'").length - 1;
    assert.equal(hits, 2, key + ' must appear once in the zh dictionary and once in the en one');
  }
  assert.equal(i18nSource.split("'accent.label'").length - 1, 2, 'the control needs its own label');
});

test('only known ids are accepted, and unknown ones are reported as stale', () => {
  assert.equal(isAccentId('teal'), true);
  assert.equal(isAccentId('TEAL'), false);
  assert.equal(isAccentId(''), false);
  assert.equal(isAccentId(null), false);
  assert.deepEqual(parseStoredAccent(null), { accent: null, stale: false });
  assert.deepEqual(parseStoredAccent('teal'), { accent: 'teal', stale: false });
  assert.deepEqual(parseStoredAccent('midnight'), { accent: null, stale: true });
  assert.equal(accentById('indigo').hue, ACCENTS[15].hue);
  assert.match(swatchColor(accentById('lime')), /^oklch\(0\.63 0\.152 86\.4\)$/);
});

/* -------------------------------------------------------------- the pre-paint */

function runBootstrap(storedTheme, storedAccent, systemDark) {
  const store = new Map();
  if (storedTheme !== undefined) store.set('xiaozhe-theme', storedTheme);
  if (storedAccent !== undefined) store.set(ACCENT_STORAGE_KEY, storedAccent);
  const written = [];
  const removed = [];
  const classes = new Set();
  const dataset = {};
  vm.runInNewContext(bootstrap, {
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
        classList: { add: (name) => classes.add(name), toggle: (name, on) => (on ? classes.add(name) : classes.delete(name)) },
        dataset
      }
    }
  });
  return { classes, dataset, removed, written };
}

test('the pre-paint script accepts exactly the ids the module knows', () => {
  const inline = bootstrap.match(/const accents = \[([^\]]*)\]/)?.[1] ?? '';
  const ids = inline.split(',').map((entry) => entry.trim().replace(/'/g, '')).filter(Boolean);
  assert.deepEqual(ids, [...ACCENT_IDS], 'the inline id list must match src/lib/theme/accent.ts');
});

test('the colour is pre-painted, never written, and stale values are dropped', () => {
  const inputs = [undefined, '', 'brand', 'teal', 'indigo', 'midnight', 'TEAL'];
  for (const stored of inputs) {
    for (const storedTheme of [undefined, 'dark']) {
      const label = 'accent=' + JSON.stringify(stored) + ' theme=' + JSON.stringify(storedTheme);
      const run = runBootstrap(storedTheme, stored, true);
      const { accent, stale } = parseStoredAccent(stored ?? null);
      assert.equal(run.dataset.accent, accent ?? DEFAULT_ACCENT, 'data-accent for ' + label);
      assert.deepEqual(run.written, [], 'the palette choice is never persisted by the bootstrap for ' + label);
      assert.deepEqual(run.removed, stale ? [ACCENT_STORAGE_KEY] : [], 'stale cleanup for ' + label);
      // the theme half of the same script keeps working
      assert.equal(run.dataset.theme, storedTheme === 'dark' ? 'dark' : 'dark', 'data-theme for ' + label);
    }
  }
});

/* ------------------------------------------------------------------- the css */

test('every swatch is declared in the stylesheet with the module values', () => {
  assert.equal(swatchRows.size, 16, 'expected one [data-accent="…"] row per swatch');
  for (const accent of ACCENTS) {
    const row = swatchRows.get(accent.id);
    assert.ok(row, 'missing stylesheet row for ' + accent.id);
    assert.equal(Number(row['accent-h']), accent.hue, 'hue for ' + accent.id);
    assert.equal(Number(row['accent-l']), accent.light.l, 'lightness for ' + accent.id);
    assert.equal(Number(row['accent-c']), accent.light.c, 'light chroma for ' + accent.id);
    assert.equal(Number(row['accent-cd']), accent.dark.c, 'dark chroma for ' + accent.id);
    assert.equal(Number(row['accent-ink-l']), accent.ink.l, 'ink lightness for ' + accent.id);
    assert.equal(Number(row['accent-ink-c']), accent.ink.c, 'ink chroma for ' + accent.id);
    assert.equal(Number(row['accent-soft-c']), accent.softC, 'soft tint chroma for ' + accent.id);
  }
  assert.match(appCss, /:root\[data-accent\]\s*\{[^}]*--accent:\s*oklch\(var\(--accent-l\)/, 'light accent must derive from the swatch vars');
  assert.match(appCss, /html\.dark\[data-accent\]\s*\{[^}]*--accent:\s*oklch\(0\.78 var\(--accent-cd\)/, 'dark accent must derive from the swatch vars');
  assert.match(appCss, /:root\[data-accent\]\s*\{[^}]*--accent-ink:\s*oklch\(var\(--accent-ink-l\)/, 'the readable twin derives from its own vars');
  assert.match(appCss, /:root\[data-accent\]\s*\{[^}]*--accent-soft:\s*oklch\(0\.955 var\(--accent-soft-c\)/, 'the tint chroma is per swatch');
  assert.match(appCss, /html\.dark\[data-accent\]\s*\{[^}]*--accent-ink:\s*var\(--accent\)/, 'on dark surfaces the twin is the accent itself');
});

test('the original colour is reproduced byte for byte, so choosing it changes nothing', () => {
  const lightBrand = appCss.match(/:root\[data-accent="brand"\]\s*\{([^}]*)\}/)?.[1] ?? '';
  const darkBrand = appCss.match(/html\.dark\[data-accent="brand"\]\s*\{([^}]*)\}/)?.[1] ?? '';
  for (const [block, expected] of [
    [lightBrand, { accent: '#3157d5', 'accent-hover': '#2648be', 'accent-ink': '#3157d5', 'accent-ink-hover': '#2648be', 'accent-soft': '#eef2ff' }],
    [darkBrand, { accent: '#7d96f2', 'accent-hover': '#9aafff', 'accent-ink': '#7d96f2', 'accent-ink-hover': '#9aafff', 'accent-soft': '#1b2544' }]
  ]) {
    for (const [name, value] of Object.entries(expected)) {
      assert.match(block, new RegExp('--' + name + ':\\s*' + value), name + ' must stay ' + value);
    }
  }
});

test('every swatch keeps the accent readable on both surfaces', () => {
  for (const accent of ACCENTS) {
    const row = swatchRows.get(accent.id);
    const pairs = [
      ['light ink on the page', [Number(row['accent-ink-l']), Number(row['accent-ink-c'])], BG.light],
      ['light ink on --accent-soft', [Number(row['accent-ink-l']), Number(row['accent-ink-c'])], oklchToRgb(0.955, Number(row['accent-soft-c']), accent.hue)],
      ['dark accent on the page', [0.78, Number(row['accent-cd'])], BG.dark],
      ['dark accent on --accent-soft', [0.78, Number(row['accent-cd'])], oklchToRgb(0.3, 0.055, accent.hue)]
    ];
    for (const [label, [l, c], background] of pairs) {
      const ratio = contrast(oklchToRgb(l, c, accent.hue), background);
      assert.ok(ratio >= 4.5, label + ' for ' + accent.id + ' is only ' + ratio.toFixed(2) + ':1');
      assert.match(label, /^(light ink|dark accent)/, 'the display accent is never held to text contrast');
    }
  }
});

/* ---------------------------------------------------------------- the header */

test('the palette leads the header controls and opens a fixed panel', () => {
  const actions = header.slice(header.indexOf('class="header-actions"'));
  /* The colour button is the left-most of the header's controls: that keeps it
     clear of the right edge, where an over-full action row used to push it out
     of the body box and start the page panning sideways on a phone. */
  assert.ok(
    actions.indexOf('accent-control') < actions.indexOf('theme-button'),
    'the colour control must come before the theme switch'
  );
  assert.ok(
    actions.indexOf('accent-control') < actions.indexOf('menu-button'),
    'the colour control must come before the mobile menu button'
  );
  assert.ok(
    actions.indexOf('accent-control') < actions.indexOf('language-control'),
    'the colour control must come before the language control'
  );
  assert.ok(actions.indexOf('accent-control') < actions.indexOf('<nav'), 'nothing may precede it inside the action row');
  const button = actions.slice(actions.indexOf('accent-button'), actions.indexOf('{#if accentOpen}'));
  assert.match(button, /ri-palette-line/, 'the button is the palette icon');
  assert.match(button, /aria-haspopup="dialog"/);
  assert.match(button, /aria-expanded=\{accentOpen\}/);
  assert.equal(/\{[^}]*\}/.test(button.replace(/\{[^}]*\}/g, '').replace(/<[^>]*>/g, '')), false, 'the button must carry no text');
  assert.match(appCss, /\.accent-popover\s*\{[^}]*position:\s*fixed/, 'the panel must be fixed positioned');
  assert.ok(header.includes('bind:this={accentButton}') && header.includes('bind:this={accentPopover}'), 'both nodes are measured');
});

test('the mobile menu carries the palette instead of a second theme switch', () => {
  /* lastIndexOf: the desktop nav closes long before the mobile menu does. */
  const menu = header.slice(header.indexOf('mobile-menu-controls'), header.lastIndexOf('</nav>'));
  assert.ok(!header.includes('theme-options'), 'the duplicate light/dark pills are gone');
  assert.ok(!header.includes("selectTheme('light'"), 'and so is the handler they needed');
  assert.ok(!header.includes('selectTheme'), 'the unused prop left the component with them');
  assert.match(menu, /class="mobile-menu-colors"/, 'the menu owns the colour picker');
  assert.match(menu, /mobile-menu-colors-label/, 'and labels it');
  assert.match(menu, /\{#each ACCENTS as option\}/, 'from the same palette data as the panel');
  assert.match(menu, /bind:this={menuColors}/, 'the menu grid is addressable for focus');
  assert.ok(!appCss.includes('.theme-options'), 'the pill styles went with the markup');
  assert.match(appCss, /\.mobile-menu-controls \{[^}]*flex-wrap:\s*wrap/, 'the palette can take its own row');
  assert.match(appCss, /\.mobile-menu-controls \.accent-swatch \{[^}]*border-radius:\s*11px/, 'swatches are not pill shaped');
  assert.equal((header.match(/role="radio"/g) || []).length, 2, 'one radio template per grid');
});

test('a narrow header cannot push its controls out of the body box', () => {
  /* min-width: max-content on the brand was the bug: it refused to shrink, so
     the action row was pushed past .header-inner and the phone could pan x. */
  assert.match(appCss, /\.brand \{[^}]*min-width:\s*0/, 'the brand gives way first');
  assert.ok(!/\.brand \{[^}]*min-width:\s*max-content/.test(appCss), 'and never claims max-content');
  assert.match(appCss, /\.brand-name \{[^}]*overflow:\s*hidden/, 'the name clips instead of widening the row');
  assert.match(appCss, /\.brand-name \{[^}]*text-overflow:\s*ellipsis/);
  assert.match(appCss, /html \{ overflow-x:\s*clip;? \}/, 'and no stray wide child can pan the page');
  assert.match(appCss, /@media \(max-width: 760px\) \{[\s\S]{0,200}\.header-inner \{ gap: 14px; \}/, 'the mobile gutter tightens');
});

test('the panel pops out and retracts, and keeps still for reduced motion', () => {
  assert.match(header, /import \{ fly, scale \} from 'svelte\/transition'/, 'the scale transition is the pop');
  assert.match(header, /in:scale=\{popIn\}/, 'it animates in');
  assert.match(header, /out:scale=\{popOut\}/, 'and out again');
  assert.match(header, /const popIn = \$derived\(motionOk \? \{ start: 0\.94, duration: 180, opacity: 0, easing: cubicOut \} : \{ duration: 0 \}\)/);
  assert.match(header, /const popOut = \$derived\(motionOk \? \{ start: 0\.96, duration: 120, opacity: 0, easing: cubicIn \} : \{ duration: 0 \}\)/);
  assert.match(header, /matchMedia\('\(prefers-reduced-motion: reduce\)'\)/, 'the preference is watched');
  assert.match(header, /query\.removeEventListener\('change', sync\)/, 'and the listener is cleaned up');
  assert.match(appCss, /\.accent-popover \{[^}]*transform-origin:\s*top right/, 'it grows out of its button');
});

test('a change with no wipe cross-fades instead of snapping', () => {
  assert.match(appCss, /html\.appearance-fading \*[\s\S]{0,320}transition:\s*background-color \.45s ease, color \.45s ease/, 'colour transitions carry the fade');
  assert.match(appCss, /html\.appearance-fading \*[\s\S]{0,320}transition:[^;]*border-color/, 'borders fade with it');
  assert.match(layout, /root\.classList\.add\('appearance-fading'\);\n\s*apply\(\);/, 'the class lands with the change');
  assert.match(layout, /if \(generation === revealGeneration\) root\.classList\.remove\('appearance-fading'\);/, 'and is dropped once it has landed');
  assert.match(layout, /if \(reducedMotion\) \{[\s\S]{0,120}apply\(\);\n\s*return;/, 'reduced motion stays a hard cut');
  assert.match(layout, /root\.classList\.remove\('appearance-fading'\);\n\s*root\.classList\.add\('theme-revealing'\);/, 'a wipe drops any fade first');
});

test('the panel offers a radio per swatch and wires the keyboard', () => {
  assert.match(header, /\{#each ACCENTS as option\}/);
  assert.equal(
    (header.match(/onkeydown=\{\(event\) => handleAccentKeys\(event, (accentPopover|menuColors)\)\}/g) || []).length,
    2,
    'both the panel and the menu palette are keyboard navigable'
  );
  assert.match(header, /role="radio"/);
  assert.match(header, /aria-checked=\{accent === option\.id\}/);
  assert.match(header, /tabindex=\{accent === option\.id \? 0 : -1\}/, 'roving tabindex');
  assert.match(header, /onclick=\{\(event\) => selectAccent\(option\.id, event\)\}/);
  for (const key of ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End']) {
    assert.ok(header.includes(key), 'the grid handles ' + key);
  }
  assert.match(header, /event\.key === 'Escape'[\s\S]*closeAccent\(true\)/, 'Escape closes and restores focus');
});

test('the layout owns the palette state and shares the reveal wipe', () => {
  assert.match(layout, /root\.dataset\.accent = accent;/, 'one writer for the attribute');
  assert.match(layout, /let accentPreference = \$state<AccentId \| null>\(client \? readStoredAccent\(\) : null\)/);
  assert.match(layout, /const accent = \$derived\(accentPreference \?\? DEFAULT_ACCENT\)/);
  assert.match(layout, /if \(event\.key === ACCENT_STORAGE_KEY\)/, 'other tabs sync the colour');
  assert.match(layout, /function withReveal\(origin: RevealOrigin \| null, apply: \(\) => void\)/, 'one wipe for theme and colour');
  assert.match(layout, /\{accent\} \{selectAccent\} \{toggleTheme\}/, 'both handlers reach the header');
});

test('everything that must be legible uses the ink twin, never the display accent', () => {
  /* The display accent is allowed to be bright, so it must never carry copy,
     icons, borders or focus rings: those would stop meeting 4.5:1 (3:1 for the
     non-text parts) the moment a yellow-green swatch is chosen. */
  const CRITICAL =
    /(?:^|[\s;{])(color|border-color|border|border-left|border-right|border-top|border-top-color|border-bottom-color|outline|outline-color|fill|stroke)\s*:\s*[^;{}]*var\(--accent\)\s*[;}]/;
  for (const source of accentSurfaces) {
    for (const line of source.split('\n')) {
      assert.ok(!CRITICAL.test(line), 'the display accent cannot carry text or borders: ' + line.trim().slice(0, 96));
      assert.ok(
        !/text-\[var\(--accent\)\]|border-\[var\(--accent\)\]/.test(line),
        'nor can the utility classes: ' + line.trim().slice(0, 96)
      );
    }
  }
  assert.ok(appCss.split('var(--accent-ink)').length - 1 > 50, 'the twin carries the interface');
  assert.match(appCss, /\.tag:hover \{[^}]*color: var\(--accent-ink-hover\)/, 'and has a hover shade in use');
});

test('the yellow-greens keep a bright display colour beside their readable twin', () => {
  const bright = ['lime', 'green', 'emerald'];
  for (const id of bright) {
    const accent = accentById(id);
    assert.ok(accent.light.l >= 0.75, id + ' keeps a bright display accent');
    assert.ok(accent.light.l > accent.ink.l, id + ' display accent is lighter than its twin');
    assert.ok(accent.light.c > accent.ink.c, id + ' and more chromatic, so it reads as its own hue');
    assert.ok(accent.softC >= 0.055, id + ' tints its surfaces with more chroma');
  }
  for (const accent of ACCENTS) {
    if (bright.includes(accent.id)) continue;
    assert.equal(accent.ink.l, accent.light.l, accent.id + ' reads exactly as it did before');
    assert.equal(accent.ink.c, accent.light.c, accent.id + ' keeps its chroma');
    assert.equal(accent.softC, 0.03, accent.id + ' keeps its tint');
  }
});
