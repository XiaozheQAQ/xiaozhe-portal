import { marked } from 'marked';

// Reading speed assumptions: Chinese characters and Latin words are read at
// different rates, so the estimate blends the two instead of using one number.
export const CJK_CHARS_PER_MINUTE = 300;
export const LATIN_WORDS_PER_MINUTE = 200;

export type ReadingStats = {
  cjkChars: number;
  latinWords: number;
  wordCount: number;
  readingTime: number;
};

// Minimal structural view of marked tokens: enough to walk containers without
// depending on every token variant marked may emit.
type TokenLike = {
  type?: string;
  text?: string;
  tokens?: TokenLike[];
  items?: TokenLike[];
  header?: TokenLike[];
  rows?: TokenLike[][];
};

const CJK_PATTERN = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/g;
const LATIN_WORD_PATTERN = /[A-Za-z0-9]+(?:['\u2019-][A-Za-z0-9]+)*/g;

// Fenced code is excluded so code-heavy posts do not inflate the count (the
// reading time uses the same scope); raw HTML and image nodes never contribute,
// so tag attributes, link targets and file names stay out of the text.
const SKIPPED_TOKENS = new Set(['code', 'html', 'space', 'hr', 'def', 'image']);

// Walks the marked token tree and returns only the text a reader actually sees:
// headings, paragraphs, list items, quotes and table cells, with link URLs,
// image sources, markdown markers and frontmatter left out.
export function extractMarkdownText(markdown: string): string {
  const chunks: string[] = [];

  const visit = (token: TokenLike | undefined): void => {
    if (!token || typeof token !== 'object') return;
    if (SKIPPED_TOKENS.has(token.type ?? '')) return;

    if (token.type === 'table') {
      for (const cell of token.header ?? []) visit(cell);
      for (const row of token.rows ?? []) for (const cell of row) visit(cell);
      return;
    }

    if (Array.isArray(token.tokens) && token.tokens.length) {
      for (const child of token.tokens) visit(child);
      return;
    }
    if (Array.isArray(token.items) && token.items.length) {
      for (const item of token.items) visit(item);
      return;
    }
    if (typeof token.text === 'string') chunks.push(token.text);
  };

  for (const token of marked.lexer(markdown) as TokenLike[]) visit(token);
  return chunks.join(' ').replace(/\s+/g, ' ').trim();
}

export function countReadingStatsFromText(text: string): ReadingStats {
  const cjkChars = [...text.matchAll(CJK_PATTERN)].length;
  const latinWords = [...text.matchAll(LATIN_WORD_PATTERN)].length;
  const wordCount = cjkChars + latinWords;
  const minutes = cjkChars / CJK_CHARS_PER_MINUTE + latinWords / LATIN_WORDS_PER_MINUTE;
  return { cjkChars, latinWords, wordCount, readingTime: Math.max(1, Math.ceil(minutes)) };
}

export function countReadingStats(markdown: string): ReadingStats {
  return countReadingStatsFromText(extractMarkdownText(markdown ?? ''));
}
