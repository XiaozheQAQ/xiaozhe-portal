<script lang="ts">
  import { useI18n } from '#lib/i18n';
  let { post }: {
    post: { slug: string; data: { title: string; description: string; date: string; tags: string[]; language: string; cover?: string } };
  } = $props();
  const i18n = useI18n();
  const locale = i18n.locale;
</script>

<a href={`/blog/${post.slug}`} data-locale={$locale} class="group block border-t border-[var(--line)] px-2 py-4 transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] first:border-t-0">
  <div class:has-cover={Boolean(post.data.cover)} class="blog-item-grid grid gap-4 sm:items-center sm:gap-5">
    <time class="font-mono text-xs text-[var(--muted)]">{post.data.date}</time>
    <div>
      <div class="flex flex-wrap items-center gap-2">
        <div class="text-base font-medium tracking-[-0.015em] group-hover:text-[var(--accent)]">{post.data.title}</div>
        {#if post.data.language === 'zh-CN'}
          <span class="content-language-badge">{i18n.t('content.chineseOnly')}</span>
        {/if}
      </div>
      <div class="mt-1 line-clamp-1 text-sm text-[var(--muted)]">{post.data.description}</div>
      <div class="mt-2 flex flex-wrap gap-2">
        {#each post.data.tags as tag}
          <span class="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[11px] text-[var(--accent)]">{tag}</span>
        {/each}
      </div>
    </div>
    {#if post.data.cover}
      <div class="blog-item-cover">
        <img src={post.data.cover} alt="" loading="lazy" />
      </div>
    {/if}
    <i class="ri-arrow-right-line hidden text-[var(--accent)] transition-transform group-hover:translate-x-1 sm:block" aria-hidden="true"></i>
  </div>
</a>
