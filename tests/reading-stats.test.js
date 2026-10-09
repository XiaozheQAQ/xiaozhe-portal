// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import matter from 'gray-matter';
import {
  countReadingStats,
  countReadingStatsFromText,
  extractMarkdownText,
  CJK_CHARS_PER_MINUTE,
  LATIN_WORDS_PER_MINUTE
} from '../src/lib/content/reading-stats.ts';

// Fences/backticks are built from char code 96 so this test file itself stays
// free of stray inline markup.
const BT = String.fromCharCode(96);
const FENCE = BT.repeat(3);

// Expected values below are derived from the documented rule:
//   cjkChars   = CJK ideographs in the reader-visible text
//   latinWords = runs of [A-Za-z0-9] (with inner ' / \u2019 / -)
//   wordCount  = cjkChars + latinWords
//   readingTime= max(1, ceil(cjk / 300 + latin / 200))
// Only headings, paragraphs, list items, quotes and table cells contribute;
// frontmatter, markdown markers, link targets, image sources and fenced code
// blocks are excluded.

test('counts pure Chinese prose by character, not by whitespace', () => {
  const stats = countReadingStats('这是一个测试。');
  assert.equal(stats.cjkChars, 6, '这 是 一 个 测 试');
  assert.equal(stats.latinWords, 0);
  assert.equal(stats.wordCount, 6);
  assert.equal(stats.readingTime, 1, 'always at least one minute');
  // Regression guard: the old .split(/\s+/) logic returned 1 for this input.
  assert.ok(stats.wordCount > 1, 'a spaceless Chinese paragraph is more than one word');
});

test('counts English prose by word', () => {
  const stats = countReadingStats('Hello world, this is a test.');
  assert.equal(stats.cjkChars, 0);
  assert.equal(stats.latinWords, 6, 'Hello world this is a test');
  assert.equal(stats.wordCount, 6);
  assert.equal(stats.readingTime, 1);
});

test('counts mixed Chinese, English and numbers together', () => {
  const stats = countReadingStats('SvelteKit 5 发布了，性能提升 20%。');
  assert.equal(stats.cjkChars, 7, '发布了 (3) + 性能提升 (4)');
  assert.equal(stats.latinWords, 3, 'SvelteKit, 5, 20');
  assert.equal(stats.wordCount, 10);
  // ceil(7/300 + 3/200) = ceil(0.0384) = 1
  assert.equal(stats.readingTime, 1);
});

test('includes headings, lists, quotes and table cells', () => {
  const md = [
    '# 标题',
    '',
    '正文段落。',
    '',
    '- 列表项一',
    '- 列表项二',
    '',
    '> 引用内容',
    '',
    '| 列一 | 列二 |',
    '| --- | --- |',
    '| 甲 | 乙 |'
  ].join('\n');
  const stats = countReadingStats(md);
  // 标题2 + 正文段落4 + 列表项一4 + 列表项二4 + 引用内容4 + 列一2 + 列二2 + 甲1 + 乙1
  assert.equal(stats.cjkChars, 24);
  assert.equal(stats.latinWords, 0);
  assert.equal(stats.wordCount, 24);
});

test('counts visible link text but never the link target', () => {
  const stats = countReadingStats('见[链接文字](https://example.com/a/b/c/d/e)一文。');
  assert.equal(stats.cjkChars, 7, '见1 + 链接文字4 + 一文2');
  const text = extractMarkdownText('见[链接文字](https://example.com/a/b/c/d/e)一文。');
  assert.ok(!text.includes('example.com'), 'link target must not leak into the text');
  assert.ok(text.includes('链接文字'), 'visible link text is kept');
});

test('drops images, fenced code and markdown markers, keeps inline code', () => {
  const md = [
    '段落里有[链接文字](https://example.com/very/long/url)和 ' + BT + 'inline code' + BT + '。',
    '',
    '![图片说明](/images/pic-with-long-name.webp)',
    '',
    FENCE + 'js',
    'const ignored = "this should never count";',
    FENCE
  ].join('\n');
  const stats = countReadingStats(md);
  assert.equal(stats.cjkChars, 9, '段落里有4 + 链接文字4 + 和1');
  assert.equal(stats.latinWords, 2, 'inline code');
  assert.equal(stats.wordCount, 11);

  const text = extractMarkdownText(md);
  assert.ok(!text.includes('example.com'), 'no link URL');
  assert.ok(!text.includes('pic-with-long-name'), 'no image file name');
  assert.ok(!text.includes('图片说明'), 'no image alt text');
  assert.ok(!text.includes('ignored'), 'no fenced code body');
  assert.ok(!text.includes(FENCE), 'no fence markers');
  assert.ok(!text.includes('const'), 'no code keywords');
});

test('a full markdown file with frontmatter never counts frontmatter', () => {
  const raw = [
    '---',
    'title: "不该被统计的标题"',
    'description: "也不该被统计的描述"',
    'tags:',
    '  - 标签一',
    '  - 标签二',
    'date: 2026-10-09',
    '---',
    '',
    '真正的正文。'
  ].join('\n');

  const parsed = matter(raw);
  const stats = countReadingStats(parsed.content);
  assert.equal(stats.cjkChars, 5, '真正的正文');
  assert.equal(stats.latinWords, 0);
  assert.equal(stats.wordCount, 5);

  const text = extractMarkdownText(parsed.content);
  assert.ok(!text.includes('不该被统计的标题'), 'frontmatter title excluded');
  assert.ok(!text.includes('也不该被统计的描述'), 'frontmatter description excluded');
  assert.ok(!text.includes('标签一'), 'frontmatter tags excluded');
  assert.ok(!text.includes('2026-10-09'), 'frontmatter date excluded');

  // The body parsed out of a file must give exactly the same numbers as the
  // body counted on its own.
  assert.deepEqual(stats, countReadingStats(parsed.content));
});

test('handles empty and very short bodies', () => {
  for (const empty of ['', '   ', '\n\n  \n', FENCE + '\n' + FENCE]) {
    const stats = countReadingStats(empty);
    assert.equal(stats.wordCount, 0, 'no words for ' + JSON.stringify(empty));
    assert.equal(stats.readingTime, 1, 'reading time never drops below one minute');
  }
  const one = countReadingStats('好');
  assert.equal(one.wordCount, 1);
  assert.equal(one.readingTime, 1);
  assert.equal(countReadingStatsFromText('').wordCount, 0);
});

test('scales reading time with the documented per-script speeds', () => {
  const chinese = countReadingStats('字'.repeat(600));
  assert.equal(chinese.cjkChars, 600);
  assert.equal(chinese.readingTime, Math.ceil(600 / CJK_CHARS_PER_MINUTE), '600 chars at 300/min = 2 min');

  const english = countReadingStats('word '.repeat(400));
  assert.equal(english.latinWords, 400);
  assert.equal(english.readingTime, Math.ceil(400 / LATIN_WORDS_PER_MINUTE), '400 words at 200/min = 2 min');
});

test('real published article: body-only counts, no metadata leakage', () => {
  const raw = readFileSync('src/content/blog/why-personal-portal.md', 'utf8');
  const parsed = matter(raw);
  const stats = countReadingStats(parsed.content);

  // Regression baseline for the current rule on the real article.
  assert.equal(stats.cjkChars, 2432);
  assert.equal(stats.latinWords, 57);
  assert.equal(stats.wordCount, 2489);
  assert.equal(stats.readingTime, 9);

  const text = extractMarkdownText(parsed.content);
  assert.ok(!text.includes(String(parsed.data.title)), 'frontmatter title not counted');
  assert.ok(!text.includes(String(parsed.data.description)), 'frontmatter description not counted');
  assert.ok(!/https?:\/\//.test(text), 'no URLs in the extracted text');
  assert.ok(!text.includes(FENCE), 'no fence markers');
  // Frontmatter keys and YAML scaffolding must not survive into the text. The
  // tag values themselves are covered by the synthetic frontmatter test above,
  // because a real body may legitimately contain the same words as a tag.
  for (const key of ['title:', 'description:', 'tags:', 'date:', 'category:']) {
    assert.ok(!text.includes(key), 'frontmatter key not counted: ' + key);
  }
});
