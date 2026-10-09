<script lang="ts">
  import { goto } from '$app/navigation';
  import { useI18n } from '#lib/i18n';

  let {
    initialQuery = '',
    className = '',
    placeholder = '',
    navigate = true,
    onsubmit,
    query = $bindable('')
  }: {
    initialQuery?: string;
    className?: string;
    /** Overrides the shared placeholder when a page searches a narrower scope. */
    placeholder?: string;
    /** When false the box does not navigate; the page filters its own content. */
    navigate?: boolean;
    onsubmit?: (value: string) => void;
    query?: string;
  } = $props();

  const i18n = useI18n();

  $effect(() => {
    if (!query && initialQuery) query = initialQuery;
  });

  function submit() {
    const value = query.trim();
    if (!navigate) {
      onsubmit?.(value);
      return;
    }
    void goto(value ? `/search?q=${encodeURIComponent(value)}` : '/search');
  }
</script>

<form class={`search-box ${className}`} role="search" onsubmit={(event) => { event.preventDefault(); submit(); }}>
  <label class="sr-only" for="site-search">{i18n.t('search.label')}</label>
  <i class="ri-search-line search-box-icon" aria-hidden="true"></i>
  <input id="site-search" name="q" bind:value={query} placeholder={placeholder || i18n.t('search.placeholder')} autocomplete="off" />
</form>
