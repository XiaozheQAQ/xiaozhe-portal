/**
 * One place that decides how a path becomes a canonical URL, how the site
 * describes itself, and how a page becomes structured data. Deliberately free
 * of Svelte so it can be unit tested on its own.
 */

export const SITE_ORIGIN = 'https://xiaozhe.dev';
export const SITE_NAME = 'Xiaozhe';
export const SITE_TAGLINE = 'Web / AI / Systems';
export const DEFAULT_OG_IMAGE = '/images/xiaozhe-avatar.jpg';
export const FEED_PATH = '/feed.xml';
export const MANIFEST_PATH = '/manifest.webmanifest';
export const APPLE_TOUCH_ICON = '/icons/apple-touch-icon.png';
export const GITHUB_URL = 'https://github.com/XiaozheQAQ';

const OG_LOCALES: Record<string, string> = { 'zh-CN': 'zh_CN', en: 'en_US' };

export type JsonLd = Record<string, unknown>;
export type Crumb = { name: string; path: string };

/** Absolute URL for a site path, or a pass-through when it is already absolute. */
export function absoluteUrl(path: string, origin: string = SITE_ORIGIN): string {
  if (/^https?:\/\//i.test(path)) return path;
  const suffix = path.startsWith('/') ? path : '/' + path;
  return origin.replace(/\/+$/, '') + suffix;
}

/** Collapse duplicate and trailing slashes so /blog/ and /blog share one URL. */
export function normalizePath(pathname: string): string {
  const clean = (pathname || '/').split(/[?#]/)[0];
  if (!clean.startsWith('/')) return normalizePath('/' + clean);
  const trimmed = clean.replace(/\/{2,}/g, '/');
  if (trimmed.length > 1) return trimmed.replace(/\/+$/, '') || '/';
  return '/';
}

export function canonicalUrl(pathname: string, origin: string = SITE_ORIGIN): string {
  return absoluteUrl(normalizePath(pathname), origin);
}

export function ogLocale(locale: string): string {
  return OG_LOCALES[locale] ?? OG_LOCALES['zh-CN'];
}

/** Structured data wants a machine date, but content dates are free text. */
export function machineDate(value?: string | null): string | undefined {
  if (!value) return undefined;
  const match = String(value).match(/\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : undefined;
}

export function websiteJsonLd(description: string, origin: string = SITE_ORIGIN): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    alternateName: `${SITE_NAME} — ${SITE_TAGLINE}`,
    url: absoluteUrl('/', origin),
    description,
    inLanguage: ['zh-CN', 'en'],
    author: { '@type': 'Person', name: SITE_NAME, url: absoluteUrl('/', origin) }
  };
}

export function personJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: SITE_NAME,
    url: absoluteUrl('/'),
    image: absoluteUrl(DEFAULT_OG_IMAGE),
    description: 'Web, AI and systems — writing and experiments.',
    sameAs: [GITHUB_URL]
  };
}

export function blogJsonLd(options: { name: string; description: string; path: string }): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: options.name,
    description: options.description,
    url: canonicalUrl(options.path),
    inLanguage: ['zh-CN', 'en'],
    author: { '@type': 'Person', name: SITE_NAME, url: absoluteUrl('/') }
  };
}

export function blogPostingJsonLd(options: {
  title: string;
  description: string;
  path: string;
  image?: string;
  published?: string;
  modified?: string;
  tags?: string[];
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: options.title,
    description: options.description,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl(options.path) },
    url: canonicalUrl(options.path),
    image: [absoluteUrl(options.image || DEFAULT_OG_IMAGE)],
    datePublished: machineDate(options.published),
    dateModified: machineDate(options.modified || options.published),
    keywords: options.tags && options.tags.length ? options.tags.join(', ') : undefined,
    inLanguage: ['zh-CN', 'en'],
    author: { '@type': 'Person', name: SITE_NAME, url: absoluteUrl('/') },
    publisher: { '@type': 'Person', name: SITE_NAME, url: absoluteUrl('/') }
  };
}

export function techArticleJsonLd(options: {
  title: string;
  description: string;
  path: string;
  published?: string;
  tags?: string[];
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: options.title,
    description: options.description,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl(options.path) },
    url: canonicalUrl(options.path),
    datePublished: machineDate(options.published),
    dateModified: machineDate(options.published),
    keywords: options.tags && options.tags.length ? options.tags.join(', ') : undefined,
    inLanguage: ['zh-CN', 'en'],
    author: { '@type': 'Person', name: SITE_NAME, url: absoluteUrl('/') }
  };
}

export function breadcrumbJsonLd(crumbs: Crumb[], origin: string = SITE_ORIGIN): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: canonicalUrl(crumb.path, origin)
    }))
  };
}
