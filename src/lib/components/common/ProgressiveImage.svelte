<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { useI18n } from '#lib/i18n';
  import { imageViewer } from './image-viewer';

  type Status = 'loading' | 'loaded' | 'error';
  type ObjectFit = 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';

  type Props = {
    src: string;
    alt?: string;
    width?: number;
    height?: number;
    aspectRatio?: string | number;
    objectFit?: ObjectFit;
    loading?: 'lazy' | 'eager';
    priority?: boolean;
    decoding?: 'async' | 'sync' | 'auto';
    spinnerSize?: number;
    zoomable?: boolean;
    class?: string;
    imgClass?: string;
  } & Omit<HTMLAttributes<HTMLElement>, 'src' | 'alt' | 'width' | 'height' | 'loading' | 'class'>;

  let {
    src,
    alt = '',
    width,
    height,
    aspectRatio,
    objectFit = 'cover',
    loading = 'lazy',
    priority = false,
    decoding = 'async',
    spinnerSize,
    zoomable = false,
    class: className = '',
    imgClass = '',
    ...rest
  }: Props = $props();

  let status = $state<Status>('loading');
  let image = $state<HTMLImageElement | null>(null);
  let token = 0;
  const i18n = useI18n();

  // Hand the full-resolution source to the shared viewer instead of the placeholder box.
  function openViewer() {
    if (status === 'error') return;
    const resolved = image?.currentSrc || image?.getAttribute('src') || src;
    if (!resolved) return;
    imageViewer.open([{ src: resolved, alt }], 0);
  }

  $effect(() => {
    const currentSrc = src;
    const currentImage = image;
    void currentSrc;

    token += 1;
    const currentToken = token;

    status = 'loading';
    if (!currentImage) return;

    const settle = (next: Status) => {
      if (currentToken === token) status = next;
    };
    const onLoad = () => settle(currentImage.naturalWidth > 0 ? 'loaded' : 'error');
    const onError = () => settle('error');

    currentImage.addEventListener('load', onLoad);
    currentImage.addEventListener('error', onError);
    if (currentImage.complete) onLoad();

    return () => {
      currentImage.removeEventListener('load', onLoad);
      currentImage.removeEventListener('error', onError);
    };
  });

  const resolvedLoading = $derived(priority ? 'eager' : loading);
  const styleValue = $derived(
    [
      `--pi-fit: ${objectFit};`,
      aspectRatio ? `aspect-ratio: ${aspectRatio}; height: auto;` : '',
      spinnerSize ? `--pi-spinner: ${spinnerSize}px;` : ''
    ]
      .filter(Boolean)
      .join(' ')
  );
</script>

{#snippet content()}
  <img
    bind:this={image}
    class="progressive-image__img {imgClass}"
    {src}
    {alt}
    width={width}
    height={height}
    loading={resolvedLoading}
    decoding={decoding}
    draggable="false"
    fetchpriority={priority ? 'high' : undefined}
  />
  <span class="progressive-image__spinner" aria-hidden="true"></span>
  <span class="progressive-image__error" aria-hidden="true"><i class="ri-image-line"></i></span>
{/snippet}

{#if zoomable}
  <button
    {...rest}
    type="button"
    class="progressive-image pi-js is-zoomable is-{status} {className}"
    style={styleValue}
    aria-busy={status === 'loading'}
    aria-label={i18n.t('image.zoomIn')}
    onclick={openViewer}
  >
    {@render content()}
  </button>
{:else}
  <span
    {...rest}
    class="progressive-image pi-js is-{status} {className}"
    style={styleValue}
    aria-busy={status === 'loading'}
  >
    {@render content()}
  </span>
{/if}
