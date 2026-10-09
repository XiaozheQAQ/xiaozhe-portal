<script lang="ts">
  import { onMount } from 'svelte';
  import { useI18n } from '#lib/i18n';
  import { giscusConfig, giscusSetupUrl, isGiscusConfigured } from '#lib/config/comments';
  import {
    applyDiscussionMetadata,
    markDiscussionMissing,
    resetDiscussionStats,
    type DiscussionMetadata
  } from '#lib/comments/discussion-stats';

  const i18n = useI18n();
  const locale = i18n.locale;

  /** Resolved once: the identifiers are build-time constants. */
  const configured = isGiscusConfigured();

  let container = $state<HTMLDivElement | null>(null);
  let status = $state<'idle' | 'loading' | 'ready' | 'error'>('idle');
  let loadedLocale = '';
  let initialised = false;
  /** Polls for the frame giscus injects; also guards against a script that never runs. */
  let watcher: ReturnType<typeof setInterval> | undefined;

  const currentTheme = () =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
      ? 'dark'
      : 'light';

  function stopWatcher() {
    if (watcher) {
      clearInterval(watcher);
      watcher = undefined;
    }
  }

  function clearContainer() {
    stopWatcher();
    if (container) container.innerHTML = '';
  }

  /**
   * Wait for the frame giscus injects. The frame carries loading="lazy", so it only
   * starts fetching once it scrolls near the viewport — a timeout started at mount
   * would report a failure for a widget that is merely waiting for the reader to
   * scroll down. Readiness itself comes from the widget's own messages (onMessage).
   */
  function watchForFrame() {
    const started = Date.now();
    watcher = setInterval(() => {
      const frame = container?.querySelector<HTMLIFrameElement>('iframe.giscus-frame');
      if (frame) {
        stopWatcher();
        frame.addEventListener('load', () => {
          // A frame also fires `load` for the initial about:blank document, which
          // would report "ready" before the widget exists. Reading `location`
          // succeeds only while the frame is still same-origin about:blank.
          try {
            if (frame.contentWindow?.location.href === 'about:blank') return;
          } catch {
            // Cross-origin already: the real widget document is in place.
          }
          if (status === 'loading') status = 'ready';
        });
        return;
      }
      if (Date.now() - started > 15000) {
        stopWatcher();
        if (status === 'loading') status = 'error';
      }
    }, 250);
  }

  function load(lang: string) {
    // Numbers from a previous article must never survive into this one, including
    // on the early return below.
    resetDiscussionStats();
    if (!container || !configured) return;
    clearContainer();
    status = 'loading';

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.async = true;
    script.crossOrigin = 'anonymous';

    const attributes: Record<string, string> = {
      'data-repo': giscusConfig.repo,
      'data-repo-id': giscusConfig.repoId,
      'data-category': giscusConfig.category,
      'data-category-id': giscusConfig.categoryId,
      'data-mapping': giscusConfig.mapping,
      'data-strict': giscusConfig.strict,
      'data-reactions-enabled': giscusConfig.reactionsEnabled,
      'data-emit-metadata': giscusConfig.emitMetadata,
      'data-input-position': giscusConfig.inputPosition,
      'data-theme': currentTheme(),
      'data-lang': lang,
      'data-loading': giscusConfig.loading
    };
    for (const [key, value] of Object.entries(attributes)) script.setAttribute(key, value);

    // A blocked or failed third-party script must not take the article down.
    script.onerror = () => {
      status = 'error';
      stopWatcher();
    };

    container.appendChild(script);
    watchForFrame();
  }

  function applyTheme() {
    const frame = container?.querySelector<HTMLIFrameElement>('iframe.giscus-frame');
    frame?.contentWindow?.postMessage(
      { giscus: { setConfig: { theme: currentTheme() } } },
      'https://giscus.app'
    );
  }

  /**
   * giscus reports "Discussion not found" before anybody has commented on a page,
   * and its own client logs exactly that as a warning: the discussion is created as
   * soon as a visitor submits a comment or a reaction. Treating it as a failure
   * would show a retry box on every article that simply has no comments yet.
   */
  const PENDING_GISCUS_NOTICES = ['Discussion not found'];

  function onMessage(event: MessageEvent) {
    if (event.origin !== 'https://giscus.app') return;
    const data = event.data as {
      giscus?: { discussion?: unknown; error?: unknown };
    } | null;
    if (!data || typeof data !== 'object' || !data.giscus) return;
    if (typeof data.giscus.error === 'string') {
      if (PENDING_GISCUS_NOTICES.some((notice) => (data.giscus!.error as string).includes(notice))) {
        // No discussion exists yet: zero reactions and zero comments are true.
        markDiscussionMissing();
        status = 'ready';
        stopWatcher();
        return;
      }
      status = 'error';
      stopWatcher();
      return;
    }
    // With emitMetadata enabled giscus also posts the discussion it resolved; that
    // payload carries the reaction and comment counts the outline buttons show.
    if (data.giscus.discussion && typeof data.giscus.discussion === 'object') {
      applyDiscussionMetadata(data.giscus.discussion as DiscussionMetadata);
    }
    // Any payload from the widget — a resize, metadata, or the notice above — means
    // it is alive and rendering, so the embed is ready.
    status = 'ready';
    stopWatcher();
  }

  onMount(() => {
    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
      clearContainer();
    };
  });

  // First load, then a reload whenever the site language changes, because
  // giscus only reads its language from the script attributes.
  $effect(() => {
    const active = $locale;
    if (!container || !configured) return;
    if (!initialised) {
      initialised = true;
      loadedLocale = active;
      load(active);
      return;
    }
    if (active !== loadedLocale) {
      loadedLocale = active;
      load(active);
    }
  });

  // Keep the embedded discussion in step with the site theme toggle.
  $effect(() => {
    if (status !== 'ready') return;
    const observer = new MutationObserver(applyTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  });
</script>

<!-- The id is a stable jump target for the outline action row. -->
<section id="comments" class="article-comments" aria-labelledby="article-comments-title">
  <div class="comments-heading">
    <h2 id="article-comments-title">
      <i class="ri-chat-3-line" aria-hidden="true"></i>
      {i18n.t('article.comments')}
    </h2>
    <p>{i18n.t('article.commentsIntro')}</p>
  </div>

  {#if !configured}
    <div class="comments-pending">
      <i class="ri-github-line" aria-hidden="true"></i>
      <div>
        <p class="comments-pending-title">{i18n.t('article.commentsPending')}</p>
        <p class="comments-pending-hint">{i18n.t('article.commentsPendingHint')}</p>
        <a class="comments-pending-link" href={giscusSetupUrl} target="_blank" rel="noopener noreferrer">
          {i18n.t('article.commentsSetupLink')}
          <i class="ri-arrow-right-up-line" aria-hidden="true"></i>
        </a>
      </div>
    </div>
  {:else}
    <div bind:this={container} class="comments-mount"></div>
    {#if status === 'loading'}<p class="comments-status">{i18n.t('article.commentsLoading')}</p>{/if}
    {#if status === 'error'}
      <div class="comments-error" role="status">
        <p>{i18n.t('article.commentsError')}</p>
        <button type="button" class="comments-retry" onclick={() => load($locale)}>
          <i class="ri-refresh-line" aria-hidden="true"></i>
          {i18n.t('article.commentsRetry')}
        </button>
      </div>
    {/if}
  {/if}
</section>
