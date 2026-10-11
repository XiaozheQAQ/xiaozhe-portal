<script lang="ts">
  import { onMount } from 'svelte';
  import { useI18n } from '#lib/i18n';
  import type { MaimaiSectionKey, MaimaiSummary } from '#lib/maimai/types';
  import { formatTimestamp } from '#lib/maimai/format';
  import MaimaiProfileCard from './MaimaiProfileCard.svelte';
  import MaimaiBestsPanel from './MaimaiBestsPanel.svelte';
  import MaimaiTrendChart from './MaimaiTrendChart.svelte';
  import MaimaiScoreList from './MaimaiScoreList.svelte';
  import MaimaiSectionNotice from './MaimaiSectionNotice.svelte';

  /**
   * The maimai DX archive on /status.
   *
   * The page itself is prerendered, so the archive is fetched from
   * /api/maimai/summary on the client. Every section is rendered from its own
   * status in the payload: a section that upstream could not serve shows a short
   * explanation while the rest of the archive keeps working. Nothing is faked —
   * without a configuration the page says the data is pending, and a retry
   * button always re-reads the endpoint.
   */
  type ArchiveState = 'loading' | 'ready' | 'error';

  const i18n = useI18n();
  const locale = i18n.locale;

  let phase = $state<ArchiveState>('loading');
  let archive = $state<MaimaiSummary | null>(null);
  let refreshing = $state(false);

  async function load() {
    if (refreshing) return;
    refreshing = true;
    if (!archive) phase = 'loading';
    try {
      const response = await fetch('/api/maimai/summary', { headers: { accept: 'application/json' } });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const payload = (await response.json()) as MaimaiSummary;
      if (!payload || typeof payload !== 'object' || typeof payload.sections !== 'object') {
        throw new Error('unexpected payload');
      }
      archive = payload;
      phase = 'ready';
    } catch {
      phase = 'error';
    } finally {
      refreshing = false;
    }
  }

  onMount(load);

  const sectionKeys: MaimaiSectionKey[] = ['profile', 'bests', 'trend', 'recents'];
  const statusOf = (key: MaimaiSectionKey) => archive?.sections?.[key]?.status ?? 'invalid_response';
  const failed = $derived(phase === 'error' && archive === null);
  const degraded = $derived.by(() => {
    const current = archive;
    if (!current || !current.configured) return false;
    return sectionKeys.some((key) => !['ok', 'empty'].includes(current.sections[key].status));
  });
</script>

<div class="maimai-archive" aria-busy={phase === 'loading'}>
  <div class="maimai-toolbar">
    {#if archive && phase === 'ready'}
      <p class="maimai-toolbar-meta">
        <i class="ri-database-2-line" aria-hidden="true"></i>
        <span>{i18n.t('maimai.sourceValue')}</span>
        <span>
          · {i18n.t('maimai.generatedAt')}
          {formatTimestamp(archive.generatedAt, $locale) ?? archive.generatedAt}
        </span>
      </p>
    {/if}
    <button class="status-refresh-button maimai-refresh" type="button" onclick={load} disabled={refreshing}>
      <i class:spin={refreshing} class="ri-refresh-line" aria-hidden="true"></i>
      {i18n.t(refreshing ? 'maimai.refreshing' : 'maimai.refresh')}
    </button>
  </div>

  {#if phase === 'loading' && !archive}
    <div class="maimai-skeleton" aria-hidden="true">
      {#each [0, 1, 2, 3] as row (row)}
        <span class="maimai-skeleton-row">
          <b class="maimai-skeleton-rank"></b>
          <b class="maimai-skeleton-cover"></b>
          <b class="maimai-skeleton-line"></b>
          <b class="maimai-skeleton-figure"></b>
        </span>
      {/each}
    </div>
    <p class="maimai-loading">
      <i class="ri-loader-4-line maimai-spin" aria-hidden="true"></i> {i18n.t('maimai.loading')}
    </p>
  {:else if failed}
    <article class="maimai-block">
      <p class="maimai-notice" data-status="upstream_error">
        <i class="ri-error-warning-line" aria-hidden="true"></i>
        <span>
          <strong>{i18n.t('maimai.loadFailed')}</strong>
          · {i18n.t('maimai.loadFailedHint')}
        </span>
      </p>
      <button class="maimai-retry" type="button" onclick={load} disabled={refreshing}>
        <i class="ri-refresh-line" aria-hidden="true"></i> {i18n.t('maimai.retry')}
      </button>
    </article>
  {:else if archive}
    {#if !archive.configured}
      <article class="maimai-block maimai-block-notice">
        <MaimaiSectionNotice status="unconfigured" hint />
      </article>
    {:else if statusOf('profile') === 'invalid_config'}
      <article class="maimai-block maimai-block-notice">
        <MaimaiSectionNotice status="invalid_config" hint />
      </article>
    {:else}
      <article class="maimai-block">
        <div class="maimai-block-head">
          <h3 class="maimai-block-title">
            <i class="ri-user-3-line" aria-hidden="true"></i> {i18n.t('maimai.profileTitle')}
          </h3>
        </div>
        {#if archive.profile}
          <MaimaiProfileCard profile={archive.profile} />
        {:else}
          <MaimaiSectionNotice status={statusOf('profile')} />
        {/if}
      </article>

      <article class="maimai-block">
        <div class="maimai-block-head">
          <h3 class="maimai-block-title">
            <i class="ri-trophy-line" aria-hidden="true"></i> {i18n.t('maimai.bestsTitle')}
          </h3>
          <p class="maimai-block-desc">{i18n.t('maimai.bestsDescription')}</p>
        </div>
        {#if archive.bests}
          <MaimaiBestsPanel bests={archive.bests} />
        {:else}
          <MaimaiSectionNotice status={statusOf('bests')} />
        {/if}
      </article>

      <article class="maimai-block">
        <div class="maimai-block-head">
          <h3 class="maimai-block-title">
            <i class="ri-line-chart-line" aria-hidden="true"></i> {i18n.t('maimai.trendTitle')}
          </h3>
          <p class="maimai-block-desc">{i18n.t('maimai.trendDescription')}</p>
        </div>
        {#if archive.trend && archive.trend.length > 0}
          <MaimaiTrendChart points={archive.trend} />
        {:else if archive.trend}
          <p class="maimai-notice" data-status="empty">
            <i class="ri-line-chart-line" aria-hidden="true"></i>
            <span>
              <strong>{i18n.t('maimai.trendEmpty')}</strong>
              · {i18n.t('maimai.trendEmptyHint')}
            </span>
          </p>
        {:else}
          <MaimaiSectionNotice status={statusOf('trend')} />
        {/if}
      </article>

      <article class="maimai-block">
        <div class="maimai-block-head">
          <h3 class="maimai-block-title">
            <i class="ri-history-line" aria-hidden="true"></i> {i18n.t('maimai.recentsTitle')}
          </h3>
          <p class="maimai-block-desc">
            {archive.recents && archive.recents.length > 0
              ? i18n.t('maimai.recentsDescription')
              : i18n.t('maimai.recentsUnavailable')}
          </p>
        </div>
        {#if archive.recents && archive.recents.length > 0}
          <MaimaiScoreList scores={archive.recents} variant="recent" />
        {:else if archive.recents}
          <p class="maimai-empty">{i18n.t('maimai.recentsEmpty')}</p>
        {:else}
          <MaimaiSectionNotice status={statusOf('recents')} />
        {/if}
      </article>

      {#if degraded}
        <p class="maimai-partial">
          <i class="ri-alert-line" aria-hidden="true"></i> {i18n.t('maimai.partialNotice')}
        </p>
      {/if}
    {/if}
  {/if}
</div>
