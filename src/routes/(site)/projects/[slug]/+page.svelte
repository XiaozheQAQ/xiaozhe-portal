<script lang="ts">
  import { useI18n } from '#lib/i18n';
  import MarkdownContent from '#lib/components/content/MarkdownContent.svelte';
  let { data } = $props();
  const i18n = useI18n();
</script>

<svelte:head><title>{data.project.data.title} — Xiaozhe</title><meta name="language" content={$i18n} /></svelte:head>

<article class="mx-auto max-w-[900px] pb-24 pt-12 lg:pt-20">
  <div class="font-mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">{$i18n === 'zh-CN' ? '项目' : 'Project'} · {data.project.data.status}</div>
  <h1 class="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">{data.project.data.title}</h1>
  <p class="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">{data.project.data.description}</p>
  <div class="mt-6 flex flex-wrap gap-2">{#each data.project.data.tech as tech}<span class="rounded-full border border-[var(--line)] px-3 py-1.5 font-mono text-[11px] text-[var(--muted)]">{tech}</span>{/each}</div>
  <MarkdownContent html={data.project.html} className="prose mt-12 max-w-[760px]" />
</article>
