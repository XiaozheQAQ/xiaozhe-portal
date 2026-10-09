// Pure helpers for Markdown image sizing and progressive-image markup generation.
// Deliberately free of Vite/SvelteKit/marked imports so plain Node can unit-test it.

export type ImageSize = {
  width?: number;
  height?: number;
  ratio?: string;
};

export type ImageMarkupOptions = {
  src: string;
  alt: string;
  title?: string;
  width?: number;
  height?: number;
  ratio?: string;
};

export type ParsedHtmlImage = {
  src: string;
  alt: string;
  title?: string;
  width?: number;
  height?: number;
};

export type ImageSizeMatch = {
  raw: string;
  alt: string;
  href: string;
  title: string | null;
  attrs: string;
};

const INTEGER_RE = /^\d{1,5}$/;
const RATIO_RE = /^\d{1,5}\s*\/\s*\d{1,5}$/;
const IMAGE_SIZE_SYNTAX_RE = /^!\[([^\]]*)\]\(\s*([^\s)]+)(?:\s+["']([^"']*)["'])?\s*\)\s*\{([^}]+)\}/;

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character] ?? character);
}

export function parseSizeAttrs(source: string): ImageSize {
  const out: ImageSize = {};
  if (!source) return out;
  for (const token of source.trim().split(/[\s,]+/)) {
    if (!token) continue;
    const eq = token.indexOf('=');
    if (eq === -1) continue;
    const key = token.slice(0, eq).trim().toLowerCase();
    const value = token.slice(eq + 1).trim();
    if (key === 'width' && INTEGER_RE.test(value)) out.width = Number(value);
    else if (key === 'height' && INTEGER_RE.test(value)) out.height = Number(value);
    else if (key === 'ratio' && RATIO_RE.test(value)) out.ratio = value.replace(/\s*\/\s*/g, ' / ').trim();
  }
  if ((out.width ?? 0) <= 0) delete out.width;
  if ((out.height ?? 0) <= 0) delete out.height;
  return out;
}

export function hasUsableSize(size: ImageSize): boolean {
  return Boolean((size.width && size.height) || size.ratio);
}

export function matchImageSizeSyntax(src: string): ImageSizeMatch | null {
  const match = IMAGE_SIZE_SYNTAX_RE.exec(src);
  if (!match) return null;
  return { raw: match[0], alt: match[1], href: match[2], title: match[3] ?? null, attrs: match[4] };
}

export function buildImageMarkup(options: ImageMarkupOptions): string {
  const { src, alt, title, width, height, ratio: explicitRatio } = options;
  const hasPair = Boolean(width && width > 0 && height && height > 0);
  const widthAttr = hasPair ? ' width="' + width + '"' : '';
  const heightAttr = hasPair ? ' height="' + height + '"' : '';
  const titleAttr = title ? ' title="' + escapeHtml(title) + '"' : '';
  const ratio = hasPair ? width + ' / ' + height : explicitRatio;
  const ratioClass = ratio ? ' has-ratio' : '';
  const ratioStyle = ratio ? ' style="--pi-md-ratio: ' + escapeHtml(ratio) + '"' : '';
  return '<span class="progressive-image progressive-image--md' + ratioClass + ' is-loading"' + ratioStyle + '>' +
    '<img class="progressive-image__img" src="' + escapeHtml(src) + '" alt="' + escapeHtml(alt) + '" loading="lazy" decoding="async"' + widthAttr + heightAttr + titleAttr + ' />' +
    '<span class="progressive-image__spinner" aria-hidden="true"></span>' +
    '<span class="progressive-image__error" aria-hidden="true"><i class="ri-image-line"></i></span>' +
    '</span>';
}

function isSafeImageSrc(src: string): boolean {
  const value = src.trim().toLowerCase();
  if (/^(javascript|vbscript|data):/.test(value)) return false;
  if (/^https?:\/\//.test(value)) return true;
  if (value.startsWith('/') || value.startsWith('./') || value.startsWith('../')) return true;
  return !/^[a-z][a-z0-9+.-]*:/.test(value);
}

export function parseHtmlImage(text: string): ParsedHtmlImage | null {
  const trimmed = text.trim();
  const match = /^<img\b([^>]*)>$/i.exec(trimmed);
  if (!match) return null;
  const attrs = match[1];
  const props: Record<string, string> = {};
  const attrRe = /([a-zA-Z-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'=<>]+))/g;
  let attrMatch: RegExpExecArray | null;
  while ((attrMatch = attrRe.exec(attrs)) !== null) {
    const key = attrMatch[1].toLowerCase();
    const value = attrMatch[3] ?? attrMatch[4] ?? attrMatch[5] ?? '';
    props[key] = value;
  }
  const src = props.src;
  if (!src || !isSafeImageSrc(src)) return null;
  const width = props.width && INTEGER_RE.test(props.width) ? Number(props.width) : undefined;
  const height = props.height && INTEGER_RE.test(props.height) ? Number(props.height) : undefined;
  const result: ParsedHtmlImage = { src, alt: props.alt ?? '' };
  if (props.title) result.title = props.title;
  if (width) result.width = width;
  if (height) result.height = height;
  return result;
}
