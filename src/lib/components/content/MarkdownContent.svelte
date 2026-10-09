<script lang="ts">
  import { onMount } from 'svelte';
  import { useI18n } from '#lib/i18n';
  import { imageViewer } from '#lib/components/common/image-viewer';

  let { html, className = 'prose' }: { html: string; className?: string } = $props();
  let container = $state<HTMLElement | null>(null);
  const i18n = useI18n();
  const rendered = $derived(
    html
      .replaceAll('>Copy</span>', `>${i18n.t('content.copy')}</span>`)
      .replaceAll('>Footnotes</h2>', `>${i18n.t('content.footnotes')}</h2>`)
      .replaceAll('>Back to content</a>', `>${i18n.t('content.backToContent')}</a>`)
  );

  // Progressively enhance markdown images: the renderer emits a placeholder wrapper,
  // then this attaches load/error handling and reveals the image once decoded.
  $effect(() => {
    const root = container;
    void rendered;
    if (!root) return;

    const cleanups: Array<() => void> = [];
    const entries: Array<{ wrapper: HTMLElement; image: HTMLImageElement }> = [];

    root.querySelectorAll<HTMLElement>('.progressive-image').forEach((wrapper) => {
      wrapper.classList.add('pi-js');
      const img = wrapper.querySelector<HTMLImageElement>('img');
      if (!img || !img.getAttribute('src')) return;

      img.draggable = false;
      wrapper.setAttribute('role', 'button');
      wrapper.setAttribute('tabindex', '0');
      wrapper.setAttribute('aria-label', i18n.t('image.zoomIn'));
      entries.push({ wrapper, image: img });

      const settle = (state: 'loaded' | 'error') => {
        wrapper.classList.remove('is-loading');
        wrapper.classList.toggle('is-loaded', state === 'loaded');
        wrapper.classList.toggle('is-error', state === 'error');
      };
      const onLoad = () => settle(img.naturalWidth > 0 ? 'loaded' : 'error');
      const onError = () => settle('error');

      if (img.complete) {
        settle(img.naturalWidth > 0 ? 'loaded' : 'error');
        return;
      }

      img.addEventListener('load', onLoad, { once: true });
      img.addEventListener('error', onError, { once: true });
      cleanups.push(() => {
        img.removeEventListener('load', onLoad);
        img.removeEventListener('error', onError);
      });
    });

    // Every article image joins one gallery, so the viewer can page through the whole body.
    if (entries.length) {
      const gallery = () =>
        entries.map(({ image }) => ({
          src: image.currentSrc || image.getAttribute('src') || '',
          alt: image.getAttribute('alt') ?? ''
        }));

      const open = (wrapper: HTMLElement) => {
        if (wrapper.classList.contains('is-error')) return;
        const index = entries.findIndex((entry) => entry.wrapper === wrapper);
        if (index < 0) return;
        imageViewer.open(gallery(), index);
      };

      const handleClick = (event: Event) => {
        const target = event.target;
        if (!(target instanceof Element)) return;
        const wrapper = target.closest<HTMLElement>('.progressive-image');
        if (!wrapper || !root.contains(wrapper)) return;
        event.preventDefault();
        open(wrapper);
      };

      const handleKeydown = (event: KeyboardEvent) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        const target = event.target;
        if (!(target instanceof HTMLElement) || !target.classList.contains('progressive-image')) return;
        event.preventDefault();
        open(target);
      };

      root.addEventListener('click', handleClick);
      root.addEventListener('keydown', handleKeydown);
      cleanups.push(() => {
        root.removeEventListener('click', handleClick);
        root.removeEventListener('keydown', handleKeydown);
      });
    }

    return () => cleanups.forEach((cleanup) => cleanup());
  });

  async function copyText(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch (error) {
      const textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand('copy');
      textarea.remove();
      if (!copied) console.warn('Clipboard copy was unavailable', error);
      return copied;
    }
  }

  onMount(() => {
    const handleClick = async (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest<HTMLButtonElement>('.code-copy-button');
      if (!button) return;
      const block = button.closest<HTMLElement>('.code-block');
      const encodedCode = block?.dataset.code;
      if (!encodedCode) return;
      const code = decodeURIComponent(encodedCode);

      if (!(await copyText(code))) return;
      const label = button.querySelector('span');
      if (label) label.textContent = i18n.t('content.copied');
      button.classList.add('is-copied');
      window.setTimeout(() => {
        if (label) label.textContent = i18n.t('content.copy');
        button.classList.remove('is-copied');
      }, 1600);
    };

    const root = container;
    if (!root) return;
    root.addEventListener('click', handleClick);
    return () => root.removeEventListener('click', handleClick);
  });
</script>

<div bind:this={container} class={className}>
  {@html rendered}
</div>
