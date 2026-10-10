<script lang="ts">
  import Seo from '#lib/components/common/Seo.svelte';
  import { useI18n } from '#lib/i18n';

  const i18n = useI18n();
</script>

<Seo
  title={`${i18n.t('page.offline')} — Xiaozhe`}
  description={i18n.t('page.offlineDescription')}
  path="/offline"
  noindex
/>

<section class="offline-page mx-auto max-w-2xl pb-24 pt-10" data-locale={$i18n}>
  <p class="page-kicker font-mono text-xs uppercase tracking-[0.18em] text-[var(--accent-ink)]">{i18n.t('page.offline')}</p>
  <h1 class="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">{i18n.t('page.offlineTitle')}</h1>
  <p class="mt-5 text-lg leading-8 text-[var(--muted)]">{i18n.t('page.offlineDescription')}</p>
  <div class="mt-8 flex flex-wrap gap-3">
    <button class="compact-button" onclick={() => location.reload()}>{i18n.t('page.offlineRetry')}</button>
    <a class="compact-button" href="/">{i18n.t('nav.home')}</a>
  </div>
</section>
