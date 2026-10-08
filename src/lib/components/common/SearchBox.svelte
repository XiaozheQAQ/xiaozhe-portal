<script lang="ts">
  import { goto } from '$app/navigation';
  import { useI18n } from '#lib/i18n';

  let { initialQuery = '', className = '' }: { initialQuery?: string; className?: string } = $props();
  const i18n = useI18n();
  let query = $state('');
  $effect(() => {
    if (!query && initialQuery) query = initialQuery;
  });

  function submit() {
    const value = query.trim();
    void goto(value ? `/search?q=${encodeURIComponent(value)}` : '/search');
  }
</script>

<form class={`search-box ${className}`} role="search" onsubmit={(event) => { event.preventDefault(); submit(); }}>
  <label class="sr-only" for="site-search">{i18n.t('search.label')}</label>
  <i class="ri-search-line search-box-icon" aria-hidden="true"></i>
  <input id="site-search" name="q" bind:value={query} placeholder={i18n.t('search.placeholder')} autocomplete="off" />
</form>
