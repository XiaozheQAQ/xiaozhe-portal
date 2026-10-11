<script lang="ts">
  /**
   * One cover in a score row.
   *
   * A cover is fetched from the archive's asset host, so it can arrive late or
   * never. While it is on its way a ring spins inside the square and the music
   * note waits behind it; if it never arrives the note stays as the fallback.
   * The square is the same size in every state, so a slow cover never moves the
   * row it belongs to.
   *
   * `report` remembers which source the last lifecycle event belonged to, so a
   * late event from a cover the row no longer shows cannot mark the new one as
   * ready. With no script the attribute is absent and the image is simply
   * visible.
   */
  type CoverReport = { src: string | null; state: 'ready' | 'failed' };

  let { src, alt = '' }: { src?: string | null; alt?: string } = $props();

  let report = $state<CoverReport | null>(null);
  const coverState = $derived(
    report && report.src === (src ?? null) ? report.state : src ? 'loading' : 'failed'
  );
</script>

<span class="maimai-jacket" data-state={coverState}>
  <i class="ri-music-2-line maimai-jacket-fallback" aria-hidden="true"></i>
  {#if src}
    <img
      {src}
      {alt}
      loading="lazy"
      decoding="async"
      onload={() => (report = { src: src ?? null, state: 'ready' })}
      onerror={() => (report = { src: src ?? null, state: 'failed' })}
    />
  {/if}
  <span class="maimai-jacket-ring" aria-hidden="true"></span>
</span>
