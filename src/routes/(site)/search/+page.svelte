<script lang="ts">
  let { data } = $props();
  import { onMount } from 'svelte';
  import { useI18n } from '#lib/i18n';
  import { page } from '$app/state';
  const i18n = useI18n();
  const locale = i18n.locale;
  let query = $state('');
  onMount(() => {
    query = page.url.searchParams.get('q') ?? '';
  });
  let results = $derived(
    data.items.filter((item) => `${item.title} ${item.description} ${item.keywords}`.toLowerCase().includes(query.toLowerCase().trim()))
  );
</script>

<svelte:head>
  <title>{i18n.t('page.search')} — Xiaozhe</title>
  <meta name="description" content={i18n.t('search.placeholder')} />
  <meta name="language" content={$i18n} />
</svelte:head>

<section class="pb-12 pt-10 lg:pt-16" data-locale={$locale}>
  <p class="font-mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">Index</p>
  <h1 class="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">{i18n.t('page.search')}</h1>
  <input
    class="mt-8 w-full max-w-2xl rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 outline-none transition focus:border-[var(--accent)]"
    bind:value={query}
    placeholder={i18n.t('search.placeholder')}
    aria-label={i18n.t('search.label')}
  />
</section>

<section class="border-t border-[var(--line)]">
  {#if results.length}
    {#each results as item}
      <a href={item.href} class="group block border-b border-[var(--line)] py-5">
        <div class="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--accent)]">{i18n.t(item.type)}</div>
        <h2 class="mt-2 text-lg font-medium group-hover:text-[var(--accent)]">{item.title}</h2>
        <p class="mt-1 text-sm text-[var(--muted)]">{item.description}</p>
      </a>
    {/each}
  {:else}
    <p class="py-8 text-sm text-[var(--muted)]">{i18n.t('search.empty')}</p>
  {/if}
</section>
