<script lang="ts">
  import { useI18n } from '#lib/i18n';
  import type { MaimaiScore } from '#lib/maimai/types';
  import MaimaiJacket from '#lib/features/maimai/MaimaiJacket.svelte';
  import {
    comboLabel,
    difficultyLabel,
    difficultyTone,
    formatAchievement,
    formatDxRating,
    formatNumber,
    formatTimestamp,
    rateLabel,
    syncLabel
  } from '#lib/maimai/format';

  /**
   * Shared score list for Best 35 / Best 15 and for the recent plays.
   *
   * Both lists render through this component, so they cannot drift apart in
   * layout or in difficulty colour. The row is one grid — rank, cover, title
   * block, figures — with a fixed cover column (every title starts on the same
   * line) and a fixed figures column (every achievement rate ends on the same
   * line). A field the upstream endpoint does not return leaves a dash in its
   * slot rather than a guess, so a row never collapses or shifts its neighbours.
   *
   * A play time is only ever the API's own `play_time`; when that is null the
   * row falls back to `last_played_time` under its own label, and says so when
   * neither is available. The sync time is never shown as a play time.
   */
  let { scores, variant = 'best' }: { scores: MaimaiScore[]; variant?: 'best' | 'recent' } = $props();

  const i18n = useI18n();
  const locale = i18n.locale;

  const chartTypes = ['standard', 'dx', 'utage'];
  /** Placeholder for a field the endpoint did not return; never fake data. */
  const EMPTY = '—';

  function chartTypeLabel(type: string | null): string | null {
    return type && chartTypes.includes(type) ? i18n.t('maimai.chartType.' + type) : null;
  }

  function playTimeLabel(score: MaimaiScore): string {
    const played = formatTimestamp(score.playTime, $locale);
    if (played) return i18n.t('maimai.playTime') + ' · ' + played;
    const last = formatTimestamp(score.lastPlayedTime, $locale);
    if (last) return i18n.t('maimai.lastPlayed') + ' · ' + last;
    return i18n.t('maimai.playTimeUnknown');
  }
</script>

<ol class="maimai-scores" data-variant={variant}>
  {#each scores as score, index (score.songId + '-' + index)}
    {@const rate = rateLabel(score.rate)}
    {@const difficulty = difficultyLabel(score.levelIndex)}
    {@const tone = difficultyTone(score.levelIndex, score.chartType)}
    {@const chartType = chartTypeLabel(score.chartType)}
    {@const achievement = formatAchievement(score.achievements)}
    {@const combo = comboLabel(score.combo)}
    {@const sync = syncLabel(score.sync)}
    {@const rating = formatDxRating(score.dxRating)}
    {@const songName = score.songName ?? i18n.t('maimai.unknownSong') + ' · #' + score.songId}
    <li class="maimai-score" data-variant={variant}>
      {#if variant === 'best'}
        <span class="maimai-score-rank">{index + 1}</span>
      {/if}

      <MaimaiJacket src={score.jacketUrl} />

      <div class="maimai-score-main">
        <p class="maimai-score-title" title={songName}>{songName}</p>

        <p class="maimai-score-meta">
          <span class="maimai-diff" data-difficulty={tone ?? 'unknown'}>{difficulty ?? EMPTY}</span>
          <span class="maimai-tag maimai-tag-plain">{score.level ?? EMPTY}</span>
          <span class="maimai-tag maimai-tag-plain">{chartType ?? EMPTY}</span>
          {#if combo}<span class="maimai-tag maimai-tag-combo">{combo}</span>{/if}
          {#if sync}<span class="maimai-tag maimai-tag-combo">{sync}</span>{/if}
          {#if variant === 'recent'}
            <span class="maimai-score-time">
              <i class="ri-time-line" aria-hidden="true"></i> {playTimeLabel(score)}
            </span>
          {/if}
        </p>

        <p class="maimai-score-sub">
          <span class="maimai-score-slot">
            <span class="maimai-slot-label">{i18n.t('maimai.dxScore')}</span>
            <span class="maimai-slot-value">{formatNumber(score.dxScore) ?? EMPTY}</span>
          </span>
          <span class="maimai-score-slot maimai-stars">
            {score.dxStar !== null && score.dxStar > 0 ? '★'.repeat(Math.min(5, score.dxStar)) : EMPTY}
          </span>
          <span class="maimai-score-slot">
            <span class="maimai-slot-label">{i18n.t('maimai.rating')}</span>
            <span class="maimai-slot-value">{rating !== null ? '+' + rating : EMPTY}</span>
          </span>
        </p>
      </div>

      <div class="maimai-score-figures">
        <span class="maimai-achievement">{achievement ?? EMPTY}</span>
        {#if rate}
          <span class="maimai-rate" data-rate={score.rate}>{rate}</span>
        {:else}
          <span class="maimai-rate maimai-rate-empty">{EMPTY}</span>
        {/if}
      </div>
    </li>
  {/each}
</ol>
