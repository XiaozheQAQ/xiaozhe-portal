<script lang="ts">
  import { useI18n } from '#lib/i18n';
  import { imageViewer } from './image-viewer';

  const i18n = useI18n();
  let closeButton = $state<HTMLButtonElement | null>(null);
  let loadedSrc = $state('');
  let failedSrc = $state('');
  let previousFocus: HTMLElement | null = null;
  let wasOpen = false;

  const current = $derived($imageViewer ? $imageViewer.images[$imageViewer.index] : null);
  const total = $derived($imageViewer?.images.length ?? 0);

  // Lock page scrolling, remember the trigger, and move focus into the overlay.
  $effect(() => {
    const isOpen = Boolean($imageViewer);
    if (isOpen === wasOpen) return;
    wasOpen = isOpen;

    if (isOpen) {
      previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      document.body.classList.add('image-viewer-open');
      queueMicrotask(() => closeButton?.focus());
      return;
    }

    document.body.classList.remove('image-viewer-open');
    previousFocus?.focus?.();
    previousFocus = null;
  });

  function trapFocus(event: KeyboardEvent) {
    const root = document.querySelector('.image-viewer');
    if (!root) return;
    const items = Array.from(root.querySelectorAll<HTMLButtonElement>('button:not([disabled])'));
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    const inside = active instanceof HTMLElement && root.contains(active);
    if (event.shiftKey && (active === first || !inside)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!$imageViewer) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      imageViewer.close();
      return;
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      imageViewer.go(1);
      return;
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      imageViewer.go(-1);
      return;
    }
    if (event.key === 'Tab') trapFocus(event);
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if $imageViewer && current}
  <div class="image-viewer" role="dialog" aria-modal="true" aria-label={i18n.t('image.viewer')}>
    <button
      class="image-viewer__backdrop"
      type="button"
      tabindex="-1"
      aria-label={i18n.t('image.close')}
      onclick={() => imageViewer.close()}
    ></button>

    <figure class="image-viewer__stage">
      <img
        class="image-viewer__img"
        src={current.src}
        alt={current.alt ?? ''}
        draggable="false"
        onload={() => (loadedSrc = current.src)}
        onerror={() => (failedSrc = current.src)}
      />
      {#if loadedSrc !== current.src && failedSrc !== current.src}
        <span class="image-viewer__spinner" aria-hidden="true"></span>
      {/if}
      {#if failedSrc === current.src}
        <span class="image-viewer__error"><i class="ri-image-line" aria-hidden="true"></i> {i18n.t('image.unavailable')}</span>
      {/if}
      {#if current.alt}<figcaption class="image-viewer__caption">{current.alt}</figcaption>{/if}
    </figure>

    <button
      bind:this={closeButton}
      class="image-viewer__control image-viewer__close"
      type="button"
      aria-label={i18n.t('image.close')}
      onclick={() => imageViewer.close()}
    >
      <i class="ri-close-line" aria-hidden="true"></i>
    </button>

    {#if total > 1}
      <button
        class="image-viewer__control image-viewer__nav is-prev"
        type="button"
        aria-label={i18n.t('image.previous')}
        onclick={() => imageViewer.go(-1)}
      >
        <i class="ri-arrow-left-s-line" aria-hidden="true"></i>
      </button>
      <button
        class="image-viewer__control image-viewer__nav is-next"
        type="button"
        aria-label={i18n.t('image.next')}
        onclick={() => imageViewer.go(1)}
      >
        <i class="ri-arrow-right-s-line" aria-hidden="true"></i>
      </button>
      <p class="image-viewer__counter" aria-live="polite">
        {i18n.t('image.counter').replace('{current}', String($imageViewer.index + 1)).replace('{total}', String(total))}
      </p>
    {/if}
  </div>
{/if}
