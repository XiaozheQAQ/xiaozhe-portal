<script lang="ts">
  import PostItem from '#lib/features/blog/PostItem.svelte';
  import { useI18n } from '#lib/i18n';
  import SearchBox from '#lib/components/common/SearchBox.svelte';
  let { data } = $props();
  const i18n = useI18n();
  const locale = i18n.locale;
</script>

<svelte:head><title>{i18n.t('page.blog')} — Xiaozhe</title><meta name="language" content={$i18n} /></svelte:head>

<section class="pb-12 pt-10 lg:pt-16" data-locale={$locale}>
  <p class="eyebrow">Notes</p>
  <h1 class="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">{i18n.t('page.blog')}</h1>
  <p class="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">{i18n.t('page.blogDescription')}</p>
  <SearchBox className="page-search" />
</section>

<section class="border-t border-[var(--line)]">{#each data.posts as post}<PostItem {post} />{/each}</section>
