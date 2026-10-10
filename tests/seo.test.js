// @ts-nocheck
/**
 * SEO and PWA bookkeeping. The metadata a crawler or an installer reads is
 * assembled from several files, and none of it is visible in a browser, so it
 * is checked here: canonical URLs and structured data in one pass, then the
 * manifest, the service worker, the sitemap and the per-page tags against the
 * files they point at.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';

import {
  SITE_ORIGIN,
  DEFAULT_OG_IMAGE,
  APPLE_TOUCH_ICON,
  FEED_PATH,
  MANIFEST_PATH,
  absoluteUrl,
  canonicalUrl,
  normalizePath,
  ogLocale,
  machineDate,
  websiteJsonLd,
  personJsonLd,
  blogJsonLd,
  blogPostingJsonLd,
  techArticleJsonLd,
  breadcrumbJsonLd
} from '../src/lib/seo/meta.ts';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const appCss = read('src/app.css');
const layout = read('src/routes/(site)/+layout.svelte');
const seoComponent = read('src/lib/components/common/Seo.svelte');
const i18nSource = read('src/lib/i18n/index.ts');

function sourceFiles(dir, pattern = /\+page\.svelte$/) {
  const base = new URL('../' + dir + '/', import.meta.url);
  return readdirSync(base, { withFileTypes: true }).flatMap((entry) => {
    const child = dir + '/' + entry.name;
    if (entry.isDirectory()) return sourceFiles(child, pattern);
    return pattern.test(entry.name) ? [child] : [];
  });
}

test('site paths resolve to one canonical URL each', () => {
  assert.equal(normalizePath('/blog/'), '/blog');
  assert.equal(normalizePath('//blog///'), '/blog');
  assert.equal(normalizePath('/blog?page=2'), '/blog');
  assert.equal(normalizePath('/blog#top'), '/blog');
  assert.equal(normalizePath(''), '/');
  assert.equal(normalizePath('/'), '/');
  assert.equal(normalizePath('blog'), '/blog');
  assert.equal(canonicalUrl('/blog/'), SITE_ORIGIN + '/blog');
  assert.equal(canonicalUrl('/'), SITE_ORIGIN + '/');
  assert.equal(absoluteUrl('images/a.png'), SITE_ORIGIN + '/images/a.png');
  assert.equal(absoluteUrl('https://cdn.example/a.png'), 'https://cdn.example/a.png');
  assert.equal(absoluteUrl('/blog', 'https://preview.example/'), 'https://preview.example/blog');
  assert.equal(ogLocale('en'), 'en_US');
  assert.equal(ogLocale('zh-CN'), 'zh_CN');
  assert.equal(ogLocale('fr'), 'zh_CN', 'an unknown locale falls back to the site default');
});

test('content dates become machine dates only when they really are dates', () => {
  assert.equal(machineDate('2026-10-10'), '2026-10-10');
  assert.equal(machineDate('2026-10-10T07:12:00Z'), '2026-10-10');
  assert.equal(machineDate('10 Oct 2026'), undefined);
  assert.equal(machineDate(''), undefined);
  assert.equal(machineDate(null), undefined);
});

test('structured data describes the site, a person, a post and a trail', () => {
  const site = websiteJsonLd('a description');
  assert.equal(site['@type'], 'WebSite');
  assert.equal(site.url, SITE_ORIGIN + '/');
  assert.equal(site.description, 'a description');
  assert.deepEqual(site.inLanguage, ['zh-CN', 'en']);

  const person = personJsonLd();
  assert.equal(person['@type'], 'Person');
  assert.equal(person.image, SITE_ORIGIN + DEFAULT_OG_IMAGE);
  assert.ok(person.sameAs.some((url) => url.includes('github.com/XiaozheQAQ')));

  const blog = blogJsonLd({ name: 'Blog', description: 'd', path: '/blog' });
  assert.equal(blog['@type'], 'Blog');
  assert.equal(blog.url, SITE_ORIGIN + '/blog');

  const post = blogPostingJsonLd({
    title: 'Title',
    description: 'Description',
    path: '/blog/hello',
    image: '/images/cover.webp',
    published: '2026-01-02',
    tags: ['svelte', 'perf']
  });
  assert.equal(post['@type'], 'BlogPosting');
  assert.equal(post.headline, 'Title');
  assert.equal(post.datePublished, '2026-01-02');
  assert.equal(post.dateModified, '2026-01-02', 'an unedited post was modified when it was published');
  assert.deepEqual(post.image, [SITE_ORIGIN + '/images/cover.webp']);
  assert.equal(post.keywords, 'svelte, perf');
  assert.equal(post.mainEntityOfPage['@id'], SITE_ORIGIN + '/blog/hello');
  assert.equal(typeof post.datePublished, 'string', 'no undefined dates leak into JSON-LD');

  const untagged = blogPostingJsonLd({ title: 'T', description: 'D', path: '/blog/t' });
  assert.equal(untagged.keywords, undefined);
  assert.deepEqual(untagged.image, [SITE_ORIGIN + DEFAULT_OG_IMAGE]);

  const article = techArticleJsonLd({ title: 'Lab', description: 'D', path: '/lab/x', published: '2026-02-03' });
  assert.equal(article['@type'], 'TechArticle');
  assert.equal(article.datePublished, '2026-02-03');

  const trail = breadcrumbJsonLd([
    { name: 'Xiaozhe', path: '/' },
    { name: 'Blog', path: '/blog' }
  ]);
  assert.equal(trail['@type'], 'BreadcrumbList');
  assert.deepEqual(trail.itemListElement.map((item) => item.position), [1, 2]);
  assert.equal(trail.itemListElement[1].item, SITE_ORIGIN + '/blog');
});

test('titles and cards belong to the page, never to the layout', () => {
  assert.ok(!/<title>/.test(layout), 'a layout title would outrank every page title');
  assert.ok(!/rel="canonical"/.test(layout), 'one canonical per document');
  assert.ok(!/og:title|og:description|og:image/.test(layout), 'cards are per page');
  assert.match(layout, /rel="manifest" href=\{MANIFEST_PATH\}/, 'the layout links the manifest');
  assert.match(layout, /rel="alternate" type="application\/rss\+xml"/, 'and the feed');
  assert.match(layout, /rel="apple-touch-icon" href=\{APPLE_TOUCH_ICON\}/);
  assert.match(layout, /name="theme-color"/);
  assert.match(appCss, /\.site-header/, 'sanity: the stylesheet is the one we think it is');
});

test('every page renders the shared head block with a description', () => {
  const pages = sourceFiles('src/routes/(site)');
  assert.ok(pages.length >= 9, 'the route walk should find the whole site, found ' + pages.length);
  const missing = pages.filter((page) => !read(page).includes('<Seo'));
  assert.deepEqual(missing, [], 'these pages would ship no description at all');
  const undescribed = pages.filter((page) => !/description=\{/.test(read(page)));
  assert.deepEqual(undescribed, [], 'these pages pass no description to the head block');
  const inline = pages.filter((page) => /<svelte:head>/.test(read(page)));
  assert.deepEqual(inline, [], 'these pages still build head tags by hand');
});

test('the head block emits the canonical URL, both card formats and robots', () => {
  assert.match(seoComponent, /<link rel="canonical" href=\{canonical\} \/>/);
  assert.match(seoComponent, /property="og:url" content=\{canonical\}/);
  assert.match(seoComponent, /property="og:title"/);
  assert.match(seoComponent, /property="og:description"/);
  assert.match(seoComponent, /property="og:site_name"/);
  assert.match(seoComponent, /property="og:locale" content=\{ogLocale\(\$i18n\)\}/);
  assert.match(seoComponent, /name="twitter:card" content="summary_large_image"/);
  assert.match(seoComponent, /name="robots" content="index, follow/);
  assert.match(seoComponent, /name="robots" content="noindex, follow"/);
  assert.match(seoComponent, /type="application\/ld\+json"/, 'structured data rides along');
  assert.match(seoComponent, /\{@html structuredData\}/, 'a raw-text script cannot interpolate: the tag is injected whole');
  assert.match(seoComponent, /replace\(\/<\/g, '\\\\u003c'\)/, 'and escapes content that could close it early');
  assert.ok(!/<script type="application\/ld\+json">\{JSON/.test(seoComponent), 'never emit the placeholder as literal text');
  assert.match(seoComponent, /property="article:published_time"/);
  assert.ok(!/canonicalUrl\(path \|\| '\/'\)/.test(seoComponent), 'a page without a path still gets a real URL');
});

test('the pages that must stay out of the index say so', () => {
  const search = read('src/routes/(site)/search/+page.svelte');
  const offline = read('src/routes/(site)/offline/+page.svelte');
  assert.match(search, /<Seo[\s\S]*?noindex/, 'search results are not content');
  assert.match(offline, /<Seo[\s\S]*?noindex/);
  const sitemap = read('src/routes/sitemap.xml/+server.ts');
  assert.ok(!sitemap.includes("'/search'"), 'and the sitemap does not advertise them');
  assert.ok(!sitemap.includes("'/offline'"));
});

test('the manifest is installable and its icons exist at the promised size', () => {
  const manifest = JSON.parse(read('static/manifest.webmanifest'));
  assert.equal(manifest.name, 'Xiaozhe — Web / AI / Systems');
  assert.equal(manifest.short_name, 'Xiaozhe');
  assert.equal(manifest.start_url, '/');
  assert.equal(manifest.scope, '/');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.lang, 'zh-CN');
  assert.match(manifest.background_color, /^#[0-9a-f]{6}$/i);
  assert.match(manifest.theme_color, /^#[0-9a-f]{6}$/i);

  const pngSize = (path) => {
    const buffer = readFileSync(new URL('../' + path, import.meta.url));
    assert.equal(buffer.subarray(1, 4).toString('latin1'), 'PNG', path + ' is not a PNG');
    return buffer.readUInt32BE(16) + 'x' + buffer.readUInt32BE(20);
  };
  const sizes = manifest.icons.map((icon) => {
    assert.ok(existsSync(new URL('../static' + icon.src, import.meta.url)), icon.src + ' is missing');
    assert.equal(pngSize('static' + icon.src), icon.sizes, icon.src + ' is not the size it claims');
    assert.equal(icon.type, 'image/png');
    return icon.sizes;
  });
  assert.ok(sizes.includes('192x192') && sizes.includes('512x512'), 'the sizes installers ask for');
  assert.ok(manifest.icons.some((icon) => icon.purpose === 'maskable'), 'Android needs a maskable icon');
  assert.ok(manifest.shortcuts.length >= 3, 'the shortcuts point at the main sections');
  assert.ok(manifest.shortcuts.every((shortcut) => shortcut.url.startsWith('/')));
  assert.equal(pngSize('static' + APPLE_TOUCH_ICON), '180x180');
  assert.ok(existsSync(new URL('../static' + FEED_PATH.replace('.xml', '.xml'), import.meta.url)) === false, 'the feed is generated, not static');
});

test('the service worker keeps the shell offline without swallowing the API', () => {
  const worker = read('src/service-worker.ts');
  assert.match(worker, /from '\$app\/manifest'/, 'SvelteKit 3 dropped $service-worker');
  assert.match(worker, /from '\$app\/env'/, 'the build version comes from there too');
  assert.match(worker, /immutable\.map/, 'the shell is precached from the manifest');
  assert.match(worker, /const OFFLINE_URL = '\/offline'/);
  assert.match(worker, /url\.pathname\.startsWith\('\/api\/'\)/, 'API responses are never cached');
  assert.match(worker, /request\.mode === 'navigate'/, 'pages get the navigation strategy');
  assert.match(worker, /fromCache\(request, OFFLINE_URL\)/, 'and fall back to the offline page');
  assert.match(worker, /caches\.delete\(key\)/, 'old caches are dropped per deploy');
  assert.match(worker, /assets\.map[\s\S]{0,160}filter\(/, 'the full image library is not precached');
  assert.match(worker, /LEGACY_FONT/, 'nor the legacy RemixIcon formats the bundler emits');
  assert.match(worker, /for \(const url of PRECACHE\)/, 'precaching is sequential so one slow file cannot stall the install');
  assert.match(worker, /cached \?\? fetch\(request\)/, 'a precache miss falls through to the network instead of erroring');
  assert.match(worker, /catch\(\(\) => undefined\)/, 'one unreachable entry cannot fail the install');
  const offline = read('src/routes/(site)/offline/+page.svelte');
  assert.match(offline, /page\.offlineTitle/, 'the offline page says what happened');
  assert.match(offline, /location\.reload\(\)/, 'and offers a way back');
});

test('robots and the sitemap agree with the routes that exist', () => {
  const robots = read('src/routes/robots.txt/+server.ts');
  assert.match(robots, /Allow: \//);
  assert.match(robots, /Disallow: \/api\//, 'crawlers have no business in the API');
  assert.match(robots, /Sitemap: \$\{url\.origin\}\/sitemap\.xml/);

  const sitemap = read('src/routes/sitemap.xml/+server.ts');
  for (const route of ["'/',", "{ path: '/blog' }", "{ path: '/lab' }", "{ path: '/status' }", "{ path: '/about' }"]) {
    assert.ok(sitemap.includes(route), 'the sitemap lists ' + route);
  }
  assert.match(sitemap, /lastmod/, 'crawlers get a change date');
  assert.match(sitemap, /machineDate\(item\.data\.updated \|\| item\.data\.date\)/, 'each post carries its own date');
  assert.match(sitemap, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
});

test('every string a page asks for exists in both languages', () => {
  const pages = sourceFiles('src/routes/(site)');
  const keys = new Set();
  for (const page of pages) {
    for (const hit of read(page).matchAll(/i18n\.t\('([^']+)'\)/g)) keys.add(hit[1]);
  }
  assert.ok(keys.size > 20, 'the scan should find the pages\' strings, found ' + keys.size);
  const missing = [...keys].filter((key) => (i18nSource.match(new RegExp("'" + key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "':", 'g')) || []).length < 2);
  assert.deepEqual(missing, [], 'these keys are missing from one of the two dictionaries');
});

test('the pages ship the small avatar, not the 1080px original', () => {
  const header = read('src/lib/components/layout/Header.svelte');
  const about = read('src/routes/(site)/about/+page.svelte');
  assert.match(header, /src="\/images\/xiaozhe-avatar-64\.jpg"/, 'the header draws 32px');
  assert.match(about, /src="\/images\/xiaozhe-avatar-192\.jpg"/, 'the about card draws 88px');
  for (const file of ['static/images/xiaozhe-avatar-64.jpg', 'static/images/xiaozhe-avatar-192.jpg']) {
    assert.ok(existsSync(new URL('../' + file, import.meta.url)), file + ' is missing');
  }
  const small = readFileSync(new URL('../static/images/xiaozhe-avatar-64.jpg', import.meta.url)).length;
  const full = readFileSync(new URL('../static/images/xiaozhe-avatar.jpg', import.meta.url)).length;
  assert.ok(small * 10 < full, 'the header avatar should be an order of magnitude smaller');
  assert.ok(/xiaozhe-avatar\.jpg/.test(read('src/lib/seo/meta.ts')), 'the full-size portrait still backs the social card');
});
