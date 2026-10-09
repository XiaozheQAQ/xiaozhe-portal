<script lang="ts">
  import { onMount } from 'svelte';
  import { useI18n } from '#lib/i18n';

  let { slug }: { slug: string } = $props();
  const i18n = useI18n();

  type Payload = { available?: boolean; views?: number; ephemeral?: boolean };

  let views = $state<number | null>(null);
  let ephemeral = $state(false);
  let destroyed = false;

  /**
   * The label doubles as the tooltip: a local development count says so, so a
   * number that came from memory is never mistaken for the stored one.
   */
  const label = $derived(
    ephemeral ? `${i18n.t('article.views')} · ${i18n.t('article.viewsDev')}` : i18n.t('article.views')
  );

  /**
   * Registers this visit and reads the counter back. Posting rather than getting
   * keeps the dedupe (one view per visitor per window) on the server, where it
   * cannot be skipped.
   *
   * Likes are deliberately absent: a like is a GitHub reaction on the discussion,
   * handled by giscus, and is shown next to the outline.
   */
  async function load() {
    try {
      const response = await fetch(`/api/articles/${encodeURIComponent(slug)}/engagement`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'view' })
      });
      const payload = (await response.json().catch(() => null)) as Payload | null;

      // Unavailable, malformed or failed: stay silent on purpose. There is no
      // count to show, and an error line in the byline is worse than nothing.
      if (destroyed || !payload || payload.available === false) return;
      if (!response.ok || typeof payload.views !== 'number') return;

      views = payload.views;
      ephemeral = payload.ephemeral === true;
    } catch {
      // Same reasoning as above: a counter that cannot be read disappears.
    }
  }

  onMount(() => {
    void load();
    return () => {
      destroyed = true;
    };
  });
</script>

<!--
  Rendered only once a real number exists, so the byline never shows a
  placeholder, a spinner or an "unavailable" notice.
-->
{#if views !== null}
  <div class="article-engagement">
    <span class="engagement-item" title={label}>
      <i class="ri-eye-line" aria-hidden="true"></i>
      <span class="engagement-value">{views}</span>
      <span class="sr-only">{label}</span>
    </span>
  </div>
{/if}
