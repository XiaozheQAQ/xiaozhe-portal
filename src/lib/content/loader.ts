import matter from 'gray-matter';
import { marked, Renderer, type Tokens } from 'marked';
import hljs from 'highlight.js/lib/common';
import { blogSchema, labSchema, projectSchema } from './schema';
import {
  buildImageMarkup,
  escapeHtml,
  hasUsableSize,
  matchImageSizeSyntax,
  parseHtmlImage,
  parseSizeAttrs,
  type ImageSize
} from './image-dimensions';

export type ContentKind = 'blog' | 'projects' | 'lab';

const allFiles = import.meta.glob('/src/content/**/*.md', {
  eager: true,
  query: '?raw',
  import: 'default'
}) as Record<string, string>;

function loadFiles(kind: ContentKind) {
  const prefix = `/src/content/${kind}/`;
  return Object.fromEntries(
    Object.entries(allFiles).filter(([path]) => path.startsWith(prefix))
  ) as Record<string, string>;
}

export type ContentItem = {
  slug: string;
  path: string;
  data: Record<string, unknown>;
  body: string;
  html: string;
  outline: Array<{ id: string; text: string; depth: number }>;
  readingTime: number;
  wordCount: number;
};

// Inline extension: `![alt](href){width=.. height=.. ratio=..}` attaches an optional
// size hint to a normal Markdown image. When the braces are absent or carry no usable
// size, this tokenizer returns undefined and the built-in image tokenizer takes over.
type SizedImageToken = Tokens.Image & { piDims?: ImageSize };

const GLOBAL = globalThis as { __xiaozheImageSizeExtensionInstalled?: boolean };
if (!GLOBAL.__xiaozheImageSizeExtensionInstalled) {
  GLOBAL.__xiaozheImageSizeExtensionInstalled = true;
  marked.use({
    extensions: [
      {
        name: 'image-with-size',
        level: 'inline',
        start(src: string): number | undefined {
          const index = src.indexOf('![');
          return index === -1 ? undefined : index;
        },
        tokenizer(src: string): SizedImageToken | undefined {
          const match = matchImageSizeSyntax(src);
          if (!match) return undefined;
          const piDims = parseSizeAttrs(match.attrs);
          if (!hasUsableSize(piDims)) return undefined;
          return {
            type: 'image',
            raw: match.raw,
            href: match.href,
            title: match.title,
            text: match.alt,
            tokens: [],
            piDims
          };
        }
      }
    ]
  });
}

function slugifyHeading(text: string, index: number) {
  const slug = text
    .toLowerCase()
    .trim()
    .replace(/<[^>]+>/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-');

  return slug || `section-${index + 1}`;
}

function parseCodeMeta(lang = '') {
  const language = lang.match(/^[\w+-]+/)?.[0] ?? 'text';
  const title = lang.match(/title="([^"]+)"/)?.[1];
  const lines = lang.match(/\{([^}]+)\}/)?.[1];
  const highlighted = new Set<number>();

  for (const part of lines?.split(',') ?? []) {
    const [start, end] = part.split('-').map(Number);
    if (!Number.isFinite(start)) continue;
    for (let line = start; line <= (Number.isFinite(end) ? end : start); line += 1) highlighted.add(line);
  }

  return { language, title, highlighted };
}

function renderCode(text: string, lang = '') {
  const meta = parseCodeMeta(lang);
  let highlighted = escapeHtml(text);
  if (meta.language !== 'text' && hljs.getLanguage(meta.language)) {
    highlighted = hljs.highlight(text, { language: meta.language }).value;
  }

  const lines = highlighted.split('\n');
  const numberedLines = lines.map((line, index) => {
    const lineNumber = index + 1;
    const className = meta.highlighted.has(lineNumber) ? ' code-line-highlight' : '';
    return `<span class="code-line${className}"><span class="code-line-number">${lineNumber}</span><span class="code-line-content">${line || ' '}</span></span>`;
  }).join('');
  const encodedCode = encodeURIComponent(text);
  const label = meta.title ? `<span class="code-block-title">${escapeHtml(meta.title)}</span>` : '';

  return `<div class="code-block" data-code="${encodedCode}">
    <div class="code-block-toolbar"><span class="code-block-language">${escapeHtml(meta.language)}</span>${label}<button class="code-copy-button" type="button"><i class="ri-file-copy-line" aria-hidden="true"></i><span>Copy</span></button></div>
    <pre><code class="hljs language-${escapeHtml(meta.language)}">${numberedLines}</code></pre>
  </div>`;
}

function prepareMarkdown(source: string) {
  const footnotes = new Map<string, string>();
  const withoutDefinitions = source.replace(/^\[\^([^\]]+)\]:\s*(.+)$/gm, (_match, id: string, text: string) => {
    footnotes.set(id, text);
    return '';
  }).replace(/\[\^([^\]]+)\]/g, (_match, id: string) => `FOOTNOTE_REF_${id}`);

  const renderer = new Renderer();
  renderer.code = ({ text, lang }) => renderCode(text, lang ?? '');
  renderer.html = ({ text }) => {
    const image = parseHtmlImage(text);
    if (!image) return '';
    return buildImageMarkup({
      src: image.src,
      alt: image.alt,
      title: image.title,
      width: image.width,
      height: image.height
    });
  };
  renderer.image = (token) => {
    const { href, title, text } = token;
    const size = (token as SizedImageToken).piDims ?? {};
    return buildImageMarkup({
      src: href ?? '',
      alt: text ?? '',
      title: title ?? undefined,
      width: size.width,
      height: size.height,
      ratio: size.ratio
    });
  };

  let html = marked.parse(withoutDefinitions, { renderer }) as string;
  html = html.replace(/FOOTNOTE_REF_([A-Za-z0-9_-]+)/g, (_match, id: string) => {
    const number = [...footnotes.keys()].indexOf(id) + 1;
    return `<sup class="footnote-ref"><a href="#fn-${escapeHtml(id)}" id="fnref-${escapeHtml(id)}">${number}</a></sup>`;
  });

  if (footnotes.size) {
    const items = [...footnotes.entries()].map(([id, text], index) =>
      `<li id="fn-${escapeHtml(id)}"><span>${index + 1}. ${marked.parseInline(text)}</span> <a class="footnote-back" href="#fnref-${escapeHtml(id)}">Back to content</a></li>`
    ).join('');
    html += `<section class="footnotes"><h2>Footnotes</h2><ol>${items}</ol></section>`;
  }

  html = html.replace(
    /<blockquote>\s*<p>\[!(NOTE|TIP|WARNING|IMPORTANT)\]\s*([\s\S]*?)<\/p>\s*<\/blockquote>/g,
    (_match, kind: string, content: string) =>
      `<aside class="markdown-callout markdown-callout-${kind.toLowerCase()}"><strong>${kind}</strong><div>${content}</div></aside>`
  );

  return { html, footnotes };
}

function parseFile(path: string, raw: string): ContentItem {
  const parsed = matter(raw);
  const slug = String(parsed.data.slug ?? path.split('/').pop()!.replace(/\.md$/, ''));
  const wordCount = parsed.content.trim().split(/\s+/).filter(Boolean).length;
  const outline: Array<{ id: string; text: string; depth: number }> = [];
  const headingIds = new Map<string, number>();
  const tokens = marked.lexer(parsed.content);

  for (const token of tokens) {
    if (token.type !== 'heading') continue;
    const text = token.text.trim();
    const baseId = slugifyHeading(text, outline.length);
    const occurrence = headingIds.get(baseId) ?? 0;
    headingIds.set(baseId, occurrence + 1);
    const id = occurrence ? `${baseId}-${occurrence + 1}` : baseId;
    outline.push({ id, text, depth: token.depth });
  }

  const rendered = prepareMarkdown(parsed.content);
  let headingIndex = 0;
  const html = rendered.html.replace(
    /<h([1-6])>([\s\S]*?)<\/h\1>/g,
    (match, depth: string, content: string) => {
      const heading = outline[headingIndex++];
      return heading
        ? `<h${depth} id="${heading.id}"><span class="heading-content">${content}</span><a class="heading-anchor" href="#${heading.id}" aria-label="Link to ${escapeHtml(heading.text)}"><i class="ri-link" aria-hidden="true"></i></a></h${depth}>`
        : match;
    }
  );

  return {
    slug,
    path,
    data: parsed.data as Record<string, unknown>,
    body: parsed.content,
    html,
    outline,
    wordCount,
    readingTime: Math.max(1, Math.ceil(wordCount / 200))
  };
}

function validate(kind: ContentKind, data: Record<string, unknown>) {
  if (kind === 'blog') return blogSchema.parse(data);
  if (kind === 'projects') return projectSchema.parse(data);
  return labSchema.parse(data);
}

export function getCollection(kind: ContentKind) {
  return Object.entries(loadFiles(kind))
    .map(([path, raw]) => {
      const item = parseFile(path, raw);
      return { ...item, data: validate(kind, item.data) };
    })
    .sort((a, b) => {
      const ad = String((a.data as Record<string, unknown>).date ?? (a.data as Record<string, unknown>).updated ?? '');
      const bd = String((b.data as Record<string, unknown>).date ?? (b.data as Record<string, unknown>).updated ?? '');
      return bd.localeCompare(ad);
    });
}

export function getBySlug(kind: ContentKind, slug: string) {
  return getCollection(kind).find((item) => item.slug === slug);
}
