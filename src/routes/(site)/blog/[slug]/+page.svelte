<script lang="ts">
  import { useI18n } from '#lib/i18n';
  import MarkdownContent from '#lib/components/content/MarkdownContent.svelte';
  import ProgressiveImage from '#lib/components/common/ProgressiveImage.svelte';
  import { onMount } from 'svelte';
  let { data } = $props();
  const i18n = useI18n();
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

<svelte:head>
  <title>{data.post.data.title} — Xiaozhe</title>
  <meta name="description" content={data.post.data.description} />
  <meta name="language" content={$i18n} />
  {#if data.post.data.cover}
    <meta property="og:image" content={`https://xiaozhe.dev${data.post.data.cover}`} />
  {/if}
</svelte:head>

<div class="article-layout mx-auto pb-24 pt-12 lg:pt-20">
  <article>
    <div class="font-mono text-xs text-[var(--muted)]">{data.post.data.date}</div>
    <h1 class="mt-4 text-4xl font-semibold leading-tight tracking-[-0.045em] sm:text-5xl">{data.post.data.title}</h1>
    <p class="mt-5 text-lg leading-8 text-[var(--muted)]">{data.post.data.description}</p>
    {#if data.post.data.language === 'zh-CN'}
      <div class="mt-5"><span class="content-language-badge">{i18n.t('content.chineseOnly')}</span></div>
    {/if}
    <div class="mt-5 flex flex-wrap gap-2">{#each data.post.data.tags as tag}<span class="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[11px] text-[var(--accent)]">{tag}</span>{/each}</div>
    <div class="mt-4 font-mono text-xs text-[var(--muted)]">{data.post.readingTime} {$i18n === 'zh-CN' ? '分钟阅读' : 'min read'} · {data.post.wordCount} {$i18n === 'zh-CN' ? '字' : 'words'}</div>
    {#if data.post.data.cover}
      <div class="article-cover">
        <ProgressiveImage src={data.post.data.cover} alt="" width={1600} height={900} priority zoomable />
      </div>
    {/if}
    <MarkdownContent html={data.post.html} className="prose mt-12" />
  </article>
  {#if data.post.outline.length}
    <aside class="article-outline" aria-label={$i18n === 'zh-CN' ? '文章大纲' : 'Article outline'}>
      <p class="article-outline-title">{$i18n === 'zh-CN' ? '文章大纲' : 'Outline'}</p>
      {#each data.post.outline as heading}
        <a class:active={activeHeading === heading.id} href={`#${heading.id}`} data-depth={heading.depth}>{heading.text}</a>
      {/each}
    </aside>
  {/if}
</div>
