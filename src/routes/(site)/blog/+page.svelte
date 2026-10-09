<script lang="ts">
  import PostItem from '#lib/features/blog/PostItem.svelte';
  import { useI18n } from '#lib/i18n';
  import SearchBox from '#lib/components/common/SearchBox.svelte';
  let { data } = $props();
  const i18n = useI18n();
  const locale = i18n.locale;

  let query = $state('');

  // Filters the article list in place over title, summary, tags and the plain
  // text of the body. The site-wide /search page keeps its own cross-content
  // search untouched.
  const results = $derived.by(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return data.posts;
    return data.posts.filter((post) => {
      const haystack = [
        post.data.title,
        post.data.description,
        post.data.category ?? '',
        post.data.tags.join(' '),
        post.searchText ?? ''
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(needle);
    });
  });
</script>

<svelte:head><title>{i18n.t('page.blog')} — Xiaozhe</title><meta name="language" content={$i18n} /></svelte:head>

<section class="pb-12 pt-5 lg:pt-7" data-locale={$locale}>
  <p class="eyebrow page-kicker">Notes</p>
  <h1 class="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">{i18n.t('page.blog')}</h1>
  <p class="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">{i18n.t('page.blogDescription')}</p>
  <SearchBox className="page-search" placeholder={i18n.t('search.blogPlaceholder')} navigate={false} bind:query />
</section>

<section class="border-t border-[var(--line)]">
  {#if query.trim()}
    <p class="blog-result-count" aria-live="polite">{i18n.t('search.blogCount').replace('{count}', String(results.length))}</p>
  {/if}
  {#if results.length}
    {#each results as post, index}<PostItem {post} {index} />{/each}
  {:else}
    <p class="blog-empty">{i18n.t('search.blogEmpty')}</p>
  {/if}
</section>
