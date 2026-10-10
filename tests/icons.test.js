// @ts-nocheck
/**
 * Icon names are strings, so a typo in one of them is invisible to the
 * type-checker and to every other suite: the element renders, the font simply
 * has no glyph for it, and the page shows a gap. This suite compares every
 * "ri-…" name in the source against the icon stylesheet that ships with the
 * package, so a name that does not exist fails here instead of on the page.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const remixiconCss = read('node_modules/remixicon/fonts/remixicon.css');
const appHtml = read('src/app.html');

function sourceFiles(dir) {
  return readdirSync(new URL('../' + dir + '/', import.meta.url), { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? sourceFiles(dir + '/' + entry.name) : [dir + '/' + entry.name]
  );
}

const files = sourceFiles('src').filter((file) => /\.(svelte|ts|js|html|css)$/.test(file));
/* An icon name only ever appears as a class or as a quoted field, so requiring
   a boundary on the left keeps prose such as "tri-state" out of the audit. */
const ICON = /(?:^|[\s"'\`:<>])ri-[a-z0-9-]+/g;

test('every icon name in the source really exists in RemixIcon', () => {
  const missing = new Map();
  let seen = 0;
  for (const file of files) {
    for (const hit of read(file).match(ICON) ?? []) {
      const name = hit.replace(/^[\s"'\`:<>]/, '');
      seen += 1;
      if (!remixiconCss.includes('.' + name + ':before')) missing.set(name, file);
    }
  }
  assert.ok(seen > 40, 'the audit should find the icon set, not an empty list');
  assert.deepEqual(
    [...missing],
    [],
    'these names have no glyph, so they would render as a gap: ' + [...missing.keys()].join(', ')
  );
});

test('the bundled icon font is the complete upstream font, and it is preloaded', () => {
  const hash = (path) => createHash('sha256').update(readFileSync(new URL('../' + path, import.meta.url))).digest('hex');
  assert.equal(
    hash('static/fonts/remixicon.woff2'),
    hash('node_modules/remixicon/fonts/remixicon.woff2'),
    'a subset would silently blank out every icon added after it was cut; if a subset is ever wanted, this check has to change with it'
  );
  assert.match(appHtml, /rel="preload"[\s\S]{0,160}remixicon\.woff2/, 'the font is preloaded so the first paint has its glyphs');
});
