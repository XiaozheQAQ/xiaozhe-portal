# Xiaozhe Portal

A personal technical portal for Xiaozhe ([@XiaozheQAQ](https://github.com/XiaozheQAQ)) — writing, project showcases, a live status page, and a maimai DX score archive. Content is Markdown-driven and inlined at build time; there is no CMS, database, or external content source.

Built with **SvelteKit 3 + Svelte 5 + TypeScript + Tailwind CSS 4**. Deploys to **Vercel** by default, with **Tencent EdgeOne Makers** as an optional second target.

- Canonical origin: `https://xiaozhe.dev`
- Source: <https://github.com/XiaozheQAQ/xiaozhe-portal>

## Features

- **Blog** — Markdown articles with syntax highlighting, line numbers/highlighting, code-copy, footnotes, callouts, image size hints, reading-time/word-count stats, per-article outline with anchors.
- **Lab** — a compact showcase of GitHub/app/software projects (`repository` / `app` / `software` link types), grouped into maintained vs. in-development. Cards open in a new tab.
- **Status page** — course schedule & daily routine (Shanghai timezone), same-origin site health checks, and a maimai DX archive (profile, Best 50, rating trend, recent plays).
- **Article engagement** — anonymous view counts (Upstash Redis, 6-hour per-visitor dedupe, 60 req/min rate limit) plus giscus-powered comments and reaction counts.
- **Theming** — tri-state light/dark/system theme, 16 OKLCh accent colors (4.5:1 readable-ink contrast), and a View Transitions circular reveal with reduced-motion fallbacks.
- **i18n** — full zh-CN / en dictionaries.
- **SEO & PWA** — canonical URLs, Open Graph/Twitter cards, JSON-LD, RSS feed, sitemap, robots.txt, and an offline-capable service worker.
- **Footer tips** — a random author-supplied tip on each visit, including a live local-clock entry.

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | SvelteKit **3.0.1** (pinned) + Svelte 5 (runes) |
| Language | TypeScript 6 (strict) |
| Styling | Tailwind CSS 4 + a single-file design system in `src/app.css` |
| Build | Vite 8 |
| Content | marked (custom whitelist renderer) + highlight.js + gray-matter + Zod |
| Adapters | `@sveltejs/adapter-vercel` (default), `@edgeone/sveltekit` (via `adapters/edgeone.js`) |
| Tests | `node --test` (9 suites, 112 cases) + `svelte-check` |

## Run locally

Requires Node.js >= 22.17.

```bash
npm install
npm run dev
```

The project builds and runs with **zero configuration**: every environment variable falls back to an empty string, and the affected feature simply reports itself unavailable instead of inventing data.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (Vercel output) |
| `npm run build:edgeone` | Build for Tencent EdgeOne Makers (`--mode edgeone`) |
| `npm run preview` | Preview a production build |
| `npm run check` | `svelte-kit sync` + `svelte-check` (must pass with 0 errors) |
| `npm run test:<suite>` | Run one of the 9 test suites (see below) |

Test suites: `schedule`, `images`, `content`, `engagement`, `theme`, `accent`, `icons`, `maimai`, `seo`. There is no aggregate `npm test`; run each suite individually. After any change, `npm run check` and all 9 suites must stay green.

## Content model

Frontmatter is validated with Zod (`src/lib/content/schema.ts`). The loader (`src/lib/content/loader.ts`) inlines every Markdown file at build time and normalizes it into the model used by the homepage, list pages, and detail pages.

- `src/content/blog/*.md` — one article per file; the filename is the URL slug.
- `src/lib/features/lab/projects.ts` — the project cards shown in the Lab, on the homepage, and in search. Set `url` to the destination and `linkType` to `repository`, `app`, or `software`. Use `maintenance` for projects with a usable version and `development` for projects still awaiting a finished version.
- `src/content/{lab,projects}/*.md` — older records still served at their existing `/lab/{slug}` detail URLs (`/projects` redirects to `/lab`).

## Project structure

```
src/
  app.html               pre-paint theme/accent bootstrap (runs before first paint)
  app.css                single-file design system
  env.ts                 defineEnvVars: private + public env vars, missing -> ""
  service-worker.ts      PWA (precached shell, network-first pages, media cache)
  content/               Markdown sources (blog / lab / projects)
  lib/
    content/             loader, Zod schemas, reading stats, image dimensions
    server/              engagement (Upstash) and maimai (LXNS) server logic
    features/            blog / lab / maimai components
    components/          common, layout, and content components
    seo/meta.ts          canonical / OG / JSON-LD single source of truth
    theme/               tri-state theme + 16-color accent palette
    i18n/                zh-CN + en dictionaries
    status/schedule.ts   course schedule & site-probe definitions (hardcoded data)
  routes/
    (site)/              prerendered pages
    api/                 runtime JSON endpoints (engagement, maimai)
static/                  fonts, icons, images, manifest
tests/                   9 node:test suites
adapters/edgeone.js      EdgeOne adapter (official adapter + 2 compat patches)
```

## Deployment

| Platform | Trigger | Notes |
| --- | --- | --- |
| **Vercel** (default) | `npm run build` | `@sveltejs/adapter-vercel`, runtime `nodejs24.x` |
| **Tencent EdgeOne Makers** | `npm run build:edgeone` | `adapters/edgeone.js` emits a Build Output API v3 layout; `edgeone.json` sets the build command |

## Environment variables

See `.env.example` for the full list. Everything is optional — unset values become empty strings and the corresponding feature reports itself unavailable.

- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — **private**, article view counts. Unset in production: no counter is rendered. In dev: a process-local counter is used and labeled as ephemeral.
- `LXNS_DEVELOPER_API_KEY` / `MAIMAI_FRIEND_CODE` — **private**, the maimai DX archive. Unset: the page shows a "data pending" state, never fake scores.
- `PUBLIC_GISCUS_REPO` / `_REPO_ID` / `_CATEGORY` / `_CATEGORY_ID` — public giscus identifiers (working defaults are built in, so comments render without them).

Private variables are declared in `src/env.ts` and read only in `src/routes/api/*/+server.ts`; they are never shipped to the browser.

## Content authorship

This site is meant to read like a real person maintaining a technical space. Structure, formatting, and fact-checking can be assisted, but the author's identity, history, project stories, and achievements must come from the author — never invented. See `CONTENT_AUTHORSHIP_AUDIT.md` for the rules and `CONTENT_TODO.md` for outstanding author-supplied content.
