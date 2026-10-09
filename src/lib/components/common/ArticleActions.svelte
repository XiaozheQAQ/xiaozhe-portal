<script lang="ts">
  import { useI18n } from '#lib/i18n';
  import { discussionStats } from '#lib/comments/discussion-stats';

  const i18n = useI18n();

  // Icon-only controls, so the screen-reader label carries the number that the
  // badge shows visually.
  const commentLabel = $derived($discussionStats ? `${i18n.t('article.jumpToComments')} · ${$discussionStats.commentCount}` : i18n.t('article.jumpToComments'));
  const likeLabel = $derived($discussionStats ? `${i18n.t('article.likes')} · ${$discussionStats.reactionCount}` : i18n.t('article.likes'));
</script>

<!--
  Two icon-only controls: jump to the comments, and the like read-out beside it.
  点赞 is a GitHub reaction on the discussion, so it can only be performed inside
  giscus with a signed-in account — this row shows the number giscus reports and
  takes the reader there instead of keeping a second, anonymous counter. The
  labels and titles carry that explanation, so no caption line is needed.
-->
<div class="article-actions">
  <nav class="article-action-row" aria-label={i18n.t('article.actions')}>
    <a class="article-action" href="#comments" title={i18n.t('article.jumpToComments')} aria-label={commentLabel}>
      <i class="ri-chat-3-line" aria-hidden="true"></i>
      {#if $discussionStats}<span class="article-action-count">{$discussionStats.commentCount}</span>{/if}
    </a>
    <a class="article-action is-like" href="#comments" title={i18n.t('article.likeHint')} aria-label={likeLabel}>
      <i class="ri-heart-line" aria-hidden="true"></i>
      {#if $discussionStats}<span class="article-action-count">{$discussionStats.reactionCount}</span>{/if}
    </a>
  </nav>
</div>
