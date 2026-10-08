<script lang="ts">
  import { onMount } from 'svelte';
  import { useI18n } from '#lib/i18n';

  let { html, className = 'prose' }: { html: string; className?: string } = $props();
  let container: HTMLElement;
  const i18n = useI18n();

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

    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  });
</script>

<div bind:this={container} class={className}>
  {@html html.replaceAll('>Copy</span>', `>${i18n.t('content.copy')}</span>`).replaceAll('>Footnotes</h2>', `>${i18n.t('content.footnotes')}</h2>`).replaceAll('>Back to content</a>', `>${i18n.t('content.backToContent')}</a>`)}
</div>
