<script lang="ts">
  import { useI18n } from '#lib/i18n';
  import type { MaimaiBests } from '#lib/maimai/types';
  import { formatNumber } from '#lib/maimai/format';
  import MaimaiScoreList from './MaimaiScoreList.svelte';

  /**
   * Best 50.
   *
   * The three figures are the API's own totals: `standard_total` is the Best 35
   * total, `dx_total` the Best 15 total, and the combined number is their sum.
   * Nothing is recomputed from the score rows, so the numbers cannot drift from
   * what the player sees in the game.
   */
  let { bests }: { bests: MaimaiBests } = $props();

  const i18n = useI18n();
</script>

<div class="maimai-stats">
  <div class="maimai-stat">
    <span class="maimai-stat-label">{i18n.t('maimai.best35')}</span>
    <span class="maimai-stat-value">{formatNumber(bests.standardTotal) ?? '—'}</span>
  </div>
  <div class="maimai-stat">
    <span class="maimai-stat-label">{i18n.t('maimai.best15')}</span>
    <span class="maimai-stat-value">{formatNumber(bests.dxTotal) ?? '—'}</span>
  </div>
  <div class="maimai-stat maimai-stat-total">
    <span class="maimai-stat-label">{i18n.t('maimai.bestTotal')}</span>
    <span class="maimai-stat-value">{formatNumber(bests.total) ?? '—'}</span>
  </div>
</div>

<div class="maimai-best-grid">
  <div class="maimai-best-column">
    <h4 class="maimai-column-title">
      <i class="ri-list-ordered" aria-hidden="true"></i> {i18n.t('maimai.best35')}
      <span class="maimai-column-count">{bests.standard.length}</span>
    </h4>
    {#if bests.standard.length > 0}
      <MaimaiScoreList scores={bests.standard} variant="best" />
    {:else}
      <p class="maimai-empty">{i18n.t('maimai.status.empty')}</p>
    {/if}
  </div>

  <div class="maimai-best-column">
    <h4 class="maimai-column-title">
      <i class="ri-list-ordered" aria-hidden="true"></i> {i18n.t('maimai.best15')}
      <span class="maimai-column-count">{bests.dx.length}</span>
    </h4>
    {#if bests.dx.length > 0}
      <MaimaiScoreList scores={bests.dx} variant="best" />
    {:else}
      <p class="maimai-empty">{i18n.t('maimai.status.empty')}</p>
    {/if}
  </div>
</div>
