<script lang="ts">
  import Seo from '#lib/components/common/Seo.svelte';
  import { breadcrumbJsonLd, techArticleJsonLd } from '#lib/seo/meta';
  import { useI18n } from '#lib/i18n';
  import MarkdownContent from '#lib/components/content/MarkdownContent.svelte';
  let { data } = $props();
  const i18n = useI18n();
  const statusKeys: Record<string, string> = {
    researching: 'lab.researching',
    done: 'lab.done'
  };
</script>

<Seo
  title={`${data.lab.data.title} — ${i18n.t('page.lab')} — Xiaozhe`}
  description={data.lab.data.description}
  path={`/lab/${data.lab.slug}`}
  type="article"
  published={data.lab.data.date}
  tags={data.lab.data.tags}
  jsonLd={[
    techArticleJsonLd({
      title: data.lab.data.title,
      description: data.lab.data.description,
      path: `/lab/${data.lab.slug}`,
      published: data.lab.data.date,
      tags: data.lab.data.tags
    }),
    breadcrumbJsonLd([
      { name: 'Xiaozhe', path: '/' },
      { name: i18n.t('page.lab'), path: '/lab' },
      { name: data.lab.data.title, path: `/lab/${data.lab.slug}` }
    ])
  ]}
/>

<article class="lab-detail mx-auto pb-24 pt-5 lg:pt-7">
  <header class="lab-detail-header">
    <div class="page-kicker font-mono text-xs uppercase tracking-[0.18em] text-[var(--accent-ink)]">{i18n.t('page.lab')} / {i18n.t('lab.record')}</div>
    <h1 class="mt-3 text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">{data.lab.data.title}</h1>
    <p class="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">{data.lab.data.description}</p>
    <dl class="lab-detail-meta">
      <div><dt>{i18n.t('lab.statusLabel')}</dt><dd>{i18n.t(statusKeys[data.lab.data.status] ?? data.lab.data.status)}</dd></div>
      <div><dt>{i18n.t('lab.dateLabel')}</dt><dd>{data.lab.data.date || i18n.t('status.notAvailable')}</dd></div>
      <div><dt>{i18n.t('lab.formatLabel')}</dt><dd>{i18n.t(data.lab.data.status === 'done' ? 'lab.projectRecord' : 'lab.experimentNote')}</dd></div>
    </dl>
  </header>
  <MarkdownContent html={data.lab.html} className="prose lab-prose mt-12" />
</article>
