<script lang="ts">
  import { afterNavigate, beforeNavigate, type BeforeNavigate } from '$app/navigation';

  const showDelay = 100;
  const fadeDelay = 50;
  const fadeDuration = 150;

  let visible = $state(false);
  let fading = $state(false);
  let progress = $state(0);
  let navigationId = 0;
  let showTimer: ReturnType<typeof setTimeout> | undefined;
  let progressTimer: ReturnType<typeof setTimeout> | undefined;
  let fadeTimer: ReturnType<typeof setTimeout> | undefined;
  let resetTimer: ReturnType<typeof setTimeout> | undefined;

  function clearTimers() {
    if (showTimer) clearTimeout(showTimer);
    if (progressTimer) clearTimeout(progressTimer);
    if (fadeTimer) clearTimeout(fadeTimer);
    if (resetTimer) clearTimeout(resetTimer);
    showTimer = undefined;
    progressTimer = undefined;
    fadeTimer = undefined;
    resetTimer = undefined;
  }

  function reset() {
    clearTimers();
    visible = false;
    fading = false;
    progress = 0;
  }

  function isInternalNavigation(navigation: BeforeNavigate) {
    return !navigation.willUnload && navigation.to?.url.origin === window.location.origin;
  }

  function finish(id: number) {
    if (id !== navigationId) return;
    if (!visible) {
      reset();
      return;
    }

    clearTimers();
    progress = 100;
    fadeTimer = setTimeout(() => {
      fading = true;
      resetTimer = setTimeout(reset, fadeDuration);
    }, fadeDelay);
  }

  beforeNavigate((navigation) => {
    if (!isInternalNavigation(navigation)) return;

    navigationId += 1;
    const id = navigationId;
    reset();

    showTimer = setTimeout(() => {
      if (id !== navigationId) return;
      visible = true;
      progress = 0;
      progressTimer = setTimeout(() => {
        if (id === navigationId) progress = 78;
      }, 0);
    }, showDelay);

    navigation.complete.then(() => finish(id)).catch(() => finish(id));
  });

  afterNavigate(() => {
    finish(navigationId);
  });
</script>

{#if visible}
  <div
    class:fade-out={fading}
    class="navigation-progress"
    style={`--navigation-progress: ${progress}%`}
    aria-hidden="true"
  ></div>
{/if}
