<script lang="ts">
  import { useI18n } from '#lib/i18n';
  import type { MaimaiProfile } from '#lib/maimai/types';
  import { formatNumber, formatTimestamp } from '#lib/maimai/format';

  let { profile }: { profile: MaimaiProfile } = $props();

  const i18n = useI18n();
  const locale = i18n.locale;

  /** Trophy colours are the documented TrophyColor enum. */
  const trophyColors: Record<string, string> = {
    normal: 'var(--muted)',
    bronze: '#b87333',
    silver: '#9aa4b0',
    gold: '#d8a12a',
    rainbow: 'linear-gradient(90deg, #e05a5a, #e0a63a, #5fb86a, #4b8fe0, #a765d8)'
  };

  // The player can hide their avatar and the asset host can miss one: both cases
  // fall back to the icon behind the image instead of a broken picture.
  let avatarBroken = $state(false);

  const showAvatar = $derived(Boolean(profile.iconUrl) && !avatarBroken);
  const trophyColor = $derived(profile.trophy?.color ? trophyColors[profile.trophy.color] ?? null : null);
</script>

<article class="maimai-profile">
  <div class="maimai-avatar">
    <i class="ri-user-3-line maimai-avatar-fallback" aria-hidden="true"></i>
    {#if showAvatar}
      <img
        src={profile.iconUrl}
        alt=""
        loading="lazy"
        decoding="async"
        onerror={() => (avatarBroken = true)}
      />
    {/if}
  </div>

  <div class="maimai-profile-main">
    <div class="maimai-profile-head">
      <h4 class="maimai-profile-name">{profile.name}</h4>
      {#if profile.trophy?.name}
        <span class="maimai-trophy">
          {#if trophyColor}
            <span class="maimai-trophy-dot" style={'background: ' + trophyColor}></span>
          {/if}
          <i class="ri-award-line" aria-hidden="true"></i>
          {profile.trophy.name}
        </span>
      {/if}
    </div>

    <p class="maimai-rating">
      <span class="maimai-rating-label">{i18n.t('maimai.rating')}</span>
      <span class="maimai-rating-value">{formatNumber(profile.rating)}</span>
    </p>

    <dl class="maimai-chips">
      {#if profile.courseRank !== null}
        <div class="maimai-chip">
          <dt>{i18n.t('maimai.courseRank')}</dt>
          <dd>{formatNumber(profile.courseRank)}</dd>
        </div>
      {/if}
      {#if profile.classRank !== null}
        <div class="maimai-chip">
          <dt>{i18n.t('maimai.classRank')}</dt>
          <dd>{formatNumber(profile.classRank)}</dd>
        </div>
      {/if}
      {#if profile.star !== null}
        <div class="maimai-chip">
          <dt>{i18n.t('maimai.star')}</dt>
          <dd>{formatNumber(profile.star)}</dd>
        </div>
      {/if}
      {#if profile.syncedAt}
        <div class="maimai-chip">
          <dt>{i18n.t('maimai.syncedAt')}</dt>
          <dd>{formatTimestamp(profile.syncedAt, $locale) ?? profile.syncedAt}</dd>
        </div>
      {/if}
    </dl>
  </div>
</article>
