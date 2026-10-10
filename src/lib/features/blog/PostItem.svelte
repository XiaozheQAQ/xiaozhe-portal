<script lang="ts">
  import { useI18n } from '#lib/i18n';
  import ProgressiveImage from '#lib/components/common/ProgressiveImage.svelte';
  let { post, index = 0 }: {
    post: { slug: string; data: { title: string; description: string; date: string; tags: string[]; language: string; cover?: string } };
    index?: number;
  } = $props();
  const i18n = useI18n();
  const locale = i18n.locale;
</script>

<a href={`/blog/${post.slug}`} data-locale={$locale} class:alternate={index % 2 === 1} class="blog-item group block border-t border-[var(--line)] px-2 py-5 transition hover:-translate-y-0.5 hover:border-[var(--accent-ink)] hover:bg-[var(--accent-soft)] first:border-t-0">
  <div class:has-cover={Boolean(post.data.cover)} class="blog-item-grid grid gap-5 sm:items-center">
    {#if post.data.cover}
      <div class="blog-item-cover">
        <ProgressiveImage src={post.data.cover} alt="" />
      </div>
    {/if}
    <div class="blog-item-copy">
      <div class="flex flex-wrap items-center gap-2">
        <div class="text-base font-medium tracking-[-0.015em] group-hover:text-[var(--accent-ink)]">{post.data.title}</div>
        {#if post.data.language === 'zh-CN'}
          <span class="content-language-badge">{i18n.t('content.chineseOnly')}</span>
        {/if}
      </div>
      <div class="mt-1 text-xs text-[var(--muted)]"><time>{post.data.date}</time></div>
      <div class="mt-2 line-clamp-2 text-sm leading-6 text-[var(--muted)]">{post.data.description}</div>
      <div class="mt-2 flex flex-wrap gap-2">
        {#each post.data.tags as tag}
          <span class="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[11px] text-[var(--accent-ink)]">{tag}</span>
        {/each}
      </div>
    </div>
    <i class="ri-arrow-right-line hidden text-[var(--accent-ink)] transition-transform group-hover:translate-x-1 sm:block" aria-hidden="true"></i>
  </div>
</a>
