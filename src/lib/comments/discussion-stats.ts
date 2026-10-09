import { writable } from 'svelte/store';

/**
 * Reaction and comment counts for the current article's GitHub Discussion, taken
 * from the metadata giscus itself posts to the page (see `emitMetadata`).
 *
 * Liking is deliberately NOT implemented here. A like is a GitHub reaction on the
 * discussion, so it needs a signed-in GitHub account and only giscus can perform
 * it — this store just mirrors the numbers for the surrounding UI. That keeps one
 * single like mechanism on the page instead of a second, anonymous counter.
 *
 * `null` means "not reported yet", which is not the same as zero and must not be
 * rendered as one.
 */
export type DiscussionStats = { reactionCount: number; commentCount: number } | null;

export const discussionStats = writable<DiscussionStats>(null);

/** Called before giscus is (re)loaded so numbers never leak across articles. */
export function resetDiscussionStats() {
  discussionStats.set(null);
}

/**
 * giscus reported that the page has no discussion yet — the discussion is created
 * with the first comment, so zero reactions and zero comments are simply true.
 */
export function markDiscussionMissing() {
  discussionStats.set({ reactionCount: 0, commentCount: 0 });
}

/** The subset of giscus' IMetadataMessage.discussion this UI reads. */
export type DiscussionMetadata = {
  reactionCount?: unknown;
  totalCommentCount?: unknown;
  totalReplyCount?: unknown;
};

function asCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.trunc(value) : 0;
}

/** Mirrors a `giscus.discussion` metadata payload (IMetadataMessage in giscus). */
export function applyDiscussionMetadata(discussion: DiscussionMetadata) {
  discussionStats.set({
    reactionCount: asCount(discussion.reactionCount),
    commentCount: asCount(discussion.totalCommentCount) + asCount(discussion.totalReplyCount)
  });
}
