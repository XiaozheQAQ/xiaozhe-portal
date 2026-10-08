# Xiaozhe Portal V1

SvelteKit 3 + Svelte 5 + TypeScript + Tailwind CSS 4 + Cloudflare adapter.

## Content model

- `src/content/blog/*.md` — one article per file
- `src/content/projects/*.md` — one project per file
- `src/content/lab/*.md` — one experiment per file

Frontmatter is validated with Zod. The content loader turns Markdown into a normalized model used by homepage, list pages and detail pages.

## Run locally

```bash
npm install
npm run dev
```

This V1 does not connect to any CMS, database, connector or external content source.
