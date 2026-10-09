<script lang="ts">
  import { onMount } from 'svelte';
  import { useI18n } from '#lib/i18n';

  /** Distance after which the button appears. */
  const THRESHOLD = 480;

  const i18n = useI18n();

  // Seed the state from the real scroll position instead of a hard `false`. The
  // layout remounts the whole page when the language changes ({#key $i18n}), and
  // starting hidden made the button blink out and fade back in every time a
  // reader switched language while scrolled down. On the server there is no
  // scroll position, so it still starts hidden and hidden is also correct there.
  let visible = $state(typeof window !== 'undefined' && window.scrollY > THRESHOLD);

  onMount(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      visible = window.scrollY > THRESHOLD;
    };

    // Coalesce bursts of scroll events into one state update per frame so the
    // component does not re-render on every pixel of scrolling.
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  });

  function scrollToTop() {
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  }
</script>

<button
  type="button"
  class="scroll-top"
  class:is-visible={visible}
  aria-label={i18n.t('article.scrollTop')}
  title={i18n.t('article.scrollTop')}
  onclick={scrollToTop}
>
  <i class="ri-arrow-up-line" aria-hidden="true"></i>
</button>
