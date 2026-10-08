<script lang="ts">
  import { useI18n } from '#lib/i18n';
  import MarkdownContent from '#lib/components/content/MarkdownContent.svelte';
  let { data } = $props();
  const i18n = useI18n();
  const statusKeys: Record<string, string> = {
    active: 'status.active',
    experimental: 'status.experimental',
    done: 'status.done',
    archived: 'status.archived'
  };
</script>

<svelte:head><title>{data.lab.data.title} — {i18n.t('page.lab')} — Xiaozhe</title><meta name="language" content={$i18n} /></svelte:head>

<article class="lab-detail mx-auto pb-24 pt-12 lg:pt-20">
  <header class="lab-detail-header">
    <div class="font-mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">{i18n.t('page.lab')} / record</div>
    <h1 class="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">{data.lab.data.title}</h1>
    <p class="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">{data.lab.data.description}</p>
    <dl class="lab-detail-meta">
      <div><dt>Status</dt><dd>{i18n.t(statusKeys[data.lab.data.status] ?? data.lab.data.status)}</dd></div>
      <div><dt>Date</dt><dd>{data.lab.data.date}</dd></div>
      <div><dt>Format</dt><dd>Experiment note</dd></div>
    </dl>
  </header>
  <MarkdownContent html={data.lab.html} className="prose lab-prose mt-12" />
</article>
