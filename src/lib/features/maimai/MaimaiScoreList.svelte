<script lang="ts">
  import { useI18n } from '#lib/i18n';
  import type { MaimaiScore } from '#lib/maimai/types';
  import {
    comboLabel,
    difficultyLabel,
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
   * Every score field is optional upstream, so a missing value is omitted
   * instead of guessed. A play time is only ever the API's own `play_time`;
   * when that is null the row falls back to `last_played_time` under its own
   * label, and says so when neither is available. The sync time is never shown
   * as a play time.
   */
  let { scores, variant = 'best' }: { scores: MaimaiScore[]; variant?: 'best' | 'recent' } = $props();

  const i18n = useI18n();
  const locale = i18n.locale;

  const chartTypes = ['standard', 'dx', 'utage'];

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
    {@const chartType = chartTypeLabel(score.chartType)}
    {@const achievement = formatAchievement(score.achievements)}
    {@const combo = comboLabel(score.combo)}
    {@const sync = syncLabel(score.sync)}
    {@const rating = formatDxRating(score.dxRating)}
    <li class="maimai-score">
      {#if variant === 'best'}
        <span class="maimai-score-rank">{index + 1}</span>
      {/if}

      <span class="maimai-jacket">
        <i class="ri-music-2-line maimai-jacket-fallback" aria-hidden="true"></i>
        {#if score.jacketUrl}
          <img
            src={score.jacketUrl}
            alt=""
            loading="lazy"
            decoding="async"
            onerror={(event) => ((event.currentTarget as HTMLImageElement).style.visibility = 'hidden')}
          />
        {/if}
      </span>

      <div class="maimai-score-main">
        <p class="maimai-score-title">
          {score.songName ?? i18n.t('maimai.unknownSong') + ' · #' + score.songId}
        </p>
        <p class="maimai-score-meta">
          {#if difficulty}<span class="maimai-tag">{difficulty}</span>{/if}
          {#if score.level}<span class="maimai-tag maimai-tag-plain">{score.level}</span>{/if}
          {#if chartType}<span class="maimai-tag maimai-tag-plain">{chartType}</span>{/if}
          {#if combo}<span class="maimai-tag maimai-tag-combo">{combo}</span>{/if}
          {#if sync}<span class="maimai-tag maimai-tag-combo">{sync}</span>{/if}
          {#if variant === 'recent'}
            <span class="maimai-score-time">
              <i class="ri-time-line" aria-hidden="true"></i> {playTimeLabel(score)}
            </span>
          {/if}
        </p>
        <p class="maimai-score-sub">
          {#if score.dxScore !== null}
            <span>{i18n.t('maimai.dxScore')} {formatNumber(score.dxScore)}</span>
          {/if}
          {#if score.dxStar !== null && score.dxStar > 0}
            <span class="maimai-stars">{'★'.repeat(Math.min(5, score.dxStar))}</span>
          {/if}
          {#if rating !== null}
            <span>{i18n.t('maimai.rating')} +{rating}</span>
          {/if}
        </p>
      </div>

      <div class="maimai-score-figures">
        {#if achievement}
          <span class="maimai-achievement">{achievement}</span>
        {/if}
        {#if rate}
          <span class="maimai-rate" data-rate={score.rate}>{rate}</span>
        {/if}
      </div>
    </li>
  {/each}
</ol>
