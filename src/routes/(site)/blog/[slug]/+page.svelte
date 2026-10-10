<script lang="ts">
  import Seo from '#lib/components/common/Seo.svelte';
  import { blogPostingJsonLd, breadcrumbJsonLd } from '#lib/seo/meta';
  import { useI18n } from '#lib/i18n';
  import MarkdownContent from '#lib/components/content/MarkdownContent.svelte';
  import ProgressiveImage from '#lib/components/common/ProgressiveImage.svelte';
  import ArticleEngagement from '#lib/components/common/ArticleEngagement.svelte';
  import ArticleActions from '#lib/components/common/ArticleActions.svelte';
  import GiscusComments from '#lib/components/common/GiscusComments.svelte';
  import ScrollTopButton from '#lib/components/common/ScrollTopButton.svelte';
  import { onMount } from 'svelte';
  let { data } = $props();
  const i18n = useI18n();
  const locale = i18n.locale;
  let activeHeading = $state('');

  onMount(() => {
    const headings = [...document.querySelectorAll<HTMLElement>('.prose h1[id], .prose h2[id], .prose h3[id]')];
    const updateActive = () => {
      const current = headings.filter((heading) => heading.getBoundingClientRect().top <= 140).at(-1);
      activeHeading = current?.id ?? headings[0]?.id ?? '';
    };
    updateActive();
    window.addEventListener('scroll', updateActive, { passive: true });
    return () => window.removeEventListener('scroll', updateActive);
  });
</script>

<Seo
  title={`${data.post.data.title} — Xiaozhe`}
  description={data.post.data.description}
  path={`/blog/${data.post.slug}`}
  type="article"
  image={data.post.data.cover}
  published={data.post.data.date}
  modified={data.post.data.updated}
  tags={data.post.data.tags}
  jsonLd={[
    blogPostingJsonLd({
      title: data.post.data.title,
      description: data.post.data.description,
      path: `/blog/${data.post.slug}`,
      image: data.post.data.cover,
      published: data.post.data.date,
      modified: data.post.data.updated,
      tags: data.post.data.tags
    }),
    breadcrumbJsonLd([
      { name: 'Xiaozhe', path: '/' },
      { name: i18n.t('page.blog'), path: '/blog' },
      { name: data.post.data.title, path: `/blog/${data.post.slug}` }
    ])
  ]}
/>

<div class="article-layout mx-auto pb-24 pt-5 lg:pt-7">
  <article>
    <div class="page-kicker font-mono text-xs text-[var(--muted)]">{data.post.data.date}</div>
    <h1 class="mt-3 text-4xl font-semibold leading-tight tracking-[-0.045em] sm:text-5xl">{data.post.data.title}</h1>
    <p class="mt-5 text-lg leading-8 text-[var(--muted)]">{data.post.data.description}</p>
    {#if data.post.data.language === 'zh-CN'}
      <div class="mt-5"><span class="content-language-badge">{i18n.t('content.chineseOnly')}</span></div>
    {/if}
    <div class="mt-5 flex flex-wrap gap-2">{#each data.post.data.tags as tag}<span class="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[11px] text-[var(--accent-ink)]">{tag}</span>{/each}</div>
    <div class="article-meta-line">
      <span class="article-reading">{i18n.t('article.readingTime').replace('{minutes}', String(data.post.readingTime))} · {i18n.t('article.words').replace('{count}', String(data.post.wordCount))}</span>
      <ArticleEngagement slug={data.post.slug} />
    </div>
    <!-- The outline (and its action row) only exists above 760px; here the same
         actions stay reachable in the article flow. -->
    <div class="article-actions-inline" class:has-outline={data.post.outline.length > 0}>
      <ArticleActions />
    </div>
    {#if data.post.data.cover}
      <div class="article-cover">
        <ProgressiveImage src={data.post.data.cover} alt="" width={1600} height={900} priority zoomable />
      </div>
    {/if}
    <MarkdownContent html={data.post.html} className="prose mt-12" />
    <GiscusComments />
  </article>
  {#if data.post.outline.length}
    <aside class="article-outline" aria-label={$i18n === 'zh-CN' ? '文章大纲' : 'Article outline'}>
      <p class="article-outline-title">
        <i class="ri-list-unordered article-outline-icon" aria-hidden="true"></i>
        {$i18n === 'zh-CN' ? '文章大纲' : 'Outline'}
      </p>
      {#each data.post.outline as heading}
        <a class:active={activeHeading === heading.id} href={`#${heading.id}`} data-depth={heading.depth}>{heading.text}</a>
      {/each}
      <ArticleActions />
    </aside>
  {/if}
</div>

<ScrollTopButton />
