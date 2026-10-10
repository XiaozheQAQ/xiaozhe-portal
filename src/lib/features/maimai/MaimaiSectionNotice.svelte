<script lang="ts">
  import { useI18n } from '#lib/i18n';
  import type { MaimaiSectionStatus } from '#lib/maimai/types';

  /**
   * One line explaining why a part of the archive is missing. The status comes
   * straight from the API payload, so the wording stays specific instead of
   * collapsing every failure into a generic error.
   */
  let { status, hint = false, icon = 'ri-information-line' }: {
    status: MaimaiSectionStatus;
    hint?: boolean;
    icon?: string;
  } = $props();

  const i18n = useI18n();
</script>

<p class="maimai-notice" data-status={status}>
  <i class={icon} aria-hidden="true"></i>
  <span>
    <strong>{i18n.t('maimai.status.' + status)}</strong>
    {#if hint && (status === 'unconfigured' || status === 'invalid_config')}
      · {i18n.t(status === 'unconfigured' ? 'maimai.unconfiguredHint' : 'maimai.invalidConfigHint')}
    {/if}
  </span>
</p>
