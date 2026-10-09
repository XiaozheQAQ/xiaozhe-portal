// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseSizeAttrs,
  hasUsableSize,
  matchImageSizeSyntax,
  buildImageMarkup,
  parseHtmlImage
} from '../src/lib/content/image-dimensions.ts';

test('parseSizeAttrs reads width/height/ratio', () => {
  assert.deepEqual(parseSizeAttrs('width=800 height=600'), { width: 800, height: 600 });
  assert.deepEqual(parseSizeAttrs('ratio=16/9'), { ratio: '16 / 9' });
  assert.deepEqual(parseSizeAttrs('width=800 height=600 ratio=4/3'), { width: 800, height: 600, ratio: '4 / 3' });
  assert.deepEqual(parseSizeAttrs('width=abc height=600'), { height: 600 });
  assert.deepEqual(parseSizeAttrs('width=0 height=600'), { height: 600 });
  assert.deepEqual(parseSizeAttrs(''), {});
});

test('hasUsableSize accepts only a ratio or width+height pair', () => {
  assert.equal(hasUsableSize({ width: 800, height: 600 }), true);
  assert.equal(hasUsableSize({ ratio: '16 / 9' }), true);
  assert.equal(hasUsableSize({ width: 800 }), false);
  assert.equal(hasUsableSize({ height: 600 }), false);
  assert.equal(hasUsableSize({}), false);
});

test('matchImageSizeSyntax matches annotated images and ignores plain ones', () => {
  const match = matchImageSizeSyntax('![alt text](/img.png "T"){width=800 height=600}');
  assert.equal(match.alt, 'alt text');
  assert.equal(match.href, '/img.png');
  assert.equal(match.title, 'T');
  assert.equal(match.attrs, 'width=800 height=600');
  assert.equal(matchImageSizeSyntax('![alt](/img.png)'), null);
  assert.equal(matchImageSizeSyntax('x ![alt](/img.png){width=800 height=600}'), null);
});

test('buildImageMarkup reserves a ratio for explicit width+height', () => {
  const html = buildImageMarkup({ src: '/a.png', alt: 'A', width: 800, height: 600 });
  assert.ok(html.includes('width="800"'));
  assert.ok(html.includes('height="600"'));
  assert.ok(html.includes('has-ratio'));
  assert.ok(html.includes('--pi-md-ratio: 800 / 600'));
  assert.ok(html.includes('is-loading'));
});

test('buildImageMarkup reserves a ratio for ratio-only hints', () => {
  const html = buildImageMarkup({ src: '/a.png', alt: 'A', ratio: '16 / 9' });
  assert.ok(html.includes('has-ratio'));
  assert.ok(html.includes('--pi-md-ratio: 16 / 9'));
  assert.ok(!html.includes('width="'));
  assert.ok(!html.includes('height="'));
});

test('buildImageMarkup keeps natural ratio when no size is known', () => {
  const html = buildImageMarkup({ src: '/a.png', alt: 'A' });
  assert.ok(!html.includes('has-ratio'));
  assert.ok(!html.includes('width="'));
  assert.ok(!html.includes('height="'));
  assert.ok(html.includes('loading="lazy"'));
});

test('buildImageMarkup escapes src/alt/title', () => {
  const html = buildImageMarkup({ src: '/a.png?x=1&y=2', alt: 'A "quoted"', title: 'T <b>' });
  assert.ok(html.includes('src="/a.png?x=1&amp;y=2"'));
  assert.ok(html.includes('alt="A &quot;quoted&quot;"'));
  assert.ok(html.includes('title="T &lt;b&gt;"'));
});

test('buildImageMarkup emits SSR placeholder scaffolding', () => {
  const html = buildImageMarkup({ src: '/a.png', alt: 'A' });
  assert.ok(html.includes('progressive-image--md'));
  assert.ok(html.includes('progressive-image__spinner'));
  assert.ok(html.includes('progressive-image__error'));
});

test('parseHtmlImage extracts a single img tag with whitelisted attrs', () => {
  const img = parseHtmlImage('<img src="/images/a.png" width="800" height="600" alt="A" title="T">');
  assert.deepEqual(img, { src: '/images/a.png', alt: 'A', title: 'T', width: 800, height: 600 });
});

test('parseHtmlImage rejects unsafe or non-img HTML', () => {
  assert.equal(parseHtmlImage('hello'), null);
  assert.equal(parseHtmlImage('<div>x</div>'), null);
  assert.equal(parseHtmlImage('<img src="javascript:alert(1)">'), null);
  assert.equal(parseHtmlImage('<img src="/a.png"> trailing'), null);
  assert.equal(parseHtmlImage('<img>'), null);
});
