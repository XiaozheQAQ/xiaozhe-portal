# Xiaozhe Portal V1

SvelteKit 3 + Svelte 5 + TypeScript + Tailwind CSS 4 + Cloudflare adapter.

## Content model

- `src/content/blog/*.md` — one article per file
- `src/lib/features/lab/projects.ts` — project cards shown in the Lab, on the homepage, and in search. Set `url` to the project's destination and `linkType` to `repository`, `app`, or `software`. Use `maintenance` for projects with a usable version and `development` for projects still awaiting a finished version.
- `src/content/{lab,projects}/*.md` — older records served at their existing detail URLs

Frontmatter is validated with Zod. The content loader turns Markdown into a normalized model used by homepage, list pages and detail pages.

## Run locally

```bash
npm install
npm run dev
```

This V1 does not connect to any CMS, database, connector or external content source.
