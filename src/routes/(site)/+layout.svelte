<script lang="ts">
  import { APPLE_TOUCH_ICON, FEED_PATH, MANIFEST_PATH, SITE_NAME } from '#lib/seo/meta';
  import '../../app.css';
  import { page } from '$app/state';
  import { flushSync, onMount } from 'svelte';
  import { createI18n } from '#lib/i18n';
  import Header from '#lib/components/layout/Header.svelte';
  import Footer from '#lib/components/layout/Footer.svelte';
  import NavigationProgress from '#lib/components/common/NavigationProgress.svelte';
  import ImageViewer from '#lib/components/common/ImageViewer.svelte';
  import {
    THEME_STORAGE_KEY,
    nextTheme,
    parseStoredTheme,
    resolveRevealOrigin,
    resolveTheme,
    revealRadius,
    type RevealOrigin,
    type ThemeName,
    type ThemePreference
  } from '#lib/theme/theme';
  import {
    ACCENT_STORAGE_KEY,
    DEFAULT_ACCENT,
    parseStoredAccent,
    type AccentId
  } from '#lib/theme/accent';

  let { children } = $props();
  const i18n = createI18n();
  const client = typeof window !== 'undefined';

  /**
   * Read synchronously — not in onMount — so the very first reactive write
   * matches what the pre-paint script in src/app.html already put on <html>.
   * Reading later would repaint the wrong theme for a frame on a dark desktop.
   */
  let themePreference = $state<ThemePreference>(client ? readStoredPreference() : null);
  let systemDark = $state(client ? systemPrefersDark() : false);
  /**
   * The primary colour is read the same synchronous way and for the same
   * reason: the pre-paint script in src/app.html already put it on <html>, so
   * the first write here must not repaint a different palette for a frame.
   * Absence of the key means the original blue-violet.
   */
  let accentPreference = $state<AccentId | null>(client ? readStoredAccent() : null);
  const theme = $derived(resolveTheme(themePreference, systemDark));
  const dark = $derived(theme === 'dark');
  const accent = $derived(accentPreference ?? DEFAULT_ACCENT);
  let mediaQuery: MediaQueryList | undefined;

  /*
   * The single writer of appearance state to the DOM. Every theme-aware surface
   * — CSS variables, color-scheme, giscus, <meta name="theme-color"> — reads
   * this class, and the accent palette is switched by one attribute on the same
   * element, so the switch, the palette, the system listener and other tabs
   * cannot drift apart.
   */
  $effect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', dark);
    root.dataset.theme = theme;
    root.dataset.themeSource = themePreference === null ? 'system' : 'explicit';
    root.dataset.accent = accent;
  });

  function systemPrefersDark(): boolean {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function readStoredPreference(): ThemePreference {
    try {
      const { preference, stale } = parseStoredTheme(localStorage.getItem(THEME_STORAGE_KEY));
      // Legacy 'system' and unknown values are dropped: absence is what means
      // "follow the system", so there is nothing left to migrate or trust.
      if (stale) localStorage.removeItem(THEME_STORAGE_KEY);
      return preference;
    } catch {
      // Blocked storage simply means the site keeps following the system.
      return null;
    }
  }

  function persistPreference(next: ThemeName) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // A blocked storage must never break the switch itself.
    }
  }

  function readStoredAccent(): AccentId | null {
    try {
      const { accent, stale } = parseStoredAccent(localStorage.getItem(ACCENT_STORAGE_KEY));
      // An unknown palette is dropped rather than guessed at, so absence keeps
      // meaning the default colour.
      if (stale) localStorage.removeItem(ACCENT_STORAGE_KEY);
      return accent;
    } catch {
      return null;
    }
  }

  function persistAccent(next: AccentId) {
    try {
      localStorage.setItem(ACCENT_STORAGE_KEY, next);
    } catch {
      // A blocked storage must never break the palette itself.
    }
  }

  let revealGeneration = 0;

  function clearReveal(root: HTMLElement) {
    root.classList.remove('theme-revealing');
    root.style.removeProperty('--theme-reveal-x');
    root.style.removeProperty('--theme-reveal-y');
    root.style.removeProperty('--theme-reveal-r');
  }

  /** Keyboard activation has no pointer position, so it reveals from the control's centre. */
  function centerOf(element: EventTarget | null): RevealOrigin {
    if (element instanceof Element) {
      const rect = element.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
    return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  }

  /**
   * The wipe shared by every appearance change — the theme and the primary
   * colour alike. The new state is applied and persisted before anything
   * animates, so the transition is decoration, never the thing that decides
   * what is on screen. Browsers without the View Transitions API, and visitors
   * who asked for less motion, get the change at once.
   */
  function withReveal(origin: RevealOrigin | null, apply: () => void) {
    const root = document.documentElement;
    const startViewTransition = (document as Document & {
      startViewTransition?: (callback: () => void) => ViewTransition;
    }).startViewTransition;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!startViewTransition || !origin || reducedMotion) {
      if (import.meta.env.DEV) {
        // Answers "why did it fade instead of wiping?" straight from the console.
        console.info(
          !startViewTransition
            ? '[appearance] cross-fade: the View Transitions API is unavailable in this browser'
            : reducedMotion
              ? '[appearance] instant switch: prefers-reduced-motion is set to reduce'
              : '[appearance] cross-fade: no reveal origin'
        );
      }
      const generation = (revealGeneration += 1);
      clearReveal(root);
      if (reducedMotion) {
        // A hard cut is the point of that preference: no wipe, no fade.
        apply();
        return;
      }
      /*
       * No wipe to carry the change, so the colours cross-fade instead of
       * snapping: the class makes every element that reads a colour token
       * animate to its new value, and it is dropped once the fade has landed.
       * The timeout is that little bit longer than the 450ms transition.
       */
      root.classList.add('appearance-fading');
      apply();
      window.setTimeout(() => {
        if (generation === revealGeneration) root.classList.remove('appearance-fading');
      }, 480);
      return;
    }

    const radius = revealRadius(origin.x, origin.y, window.innerWidth, window.innerHeight);
    root.style.setProperty('--theme-reveal-x', `${origin.x}px`);
    root.style.setProperty('--theme-reveal-y', `${origin.y}px`);
    root.style.setProperty('--theme-reveal-r', `${Math.ceil(radius)}px`);
    root.classList.remove('appearance-fading');
    root.classList.add('theme-revealing');

    const generation = (revealGeneration += 1);
    const cleanup = () => {
      // Only the newest transition cleans up: an interrupted one settles later
      // and would otherwise strip the coordinates of the reveal now running.
      if (generation === revealGeneration) clearReveal(root);
    };

    try {
      const transition = startViewTransition.call(document, () => {
        // flushSync paints the new state inside the callback, so the incoming
        // snapshot already carries it when the browser captures the frame.
        flushSync(apply);
      });
      // A skipped transition rejects both promises; that is expected, not an error.
      void transition.ready.catch(() => {});
      void transition.finished.catch(() => {}).finally(cleanup);
    } catch {
      cleanup();
      apply();
    }
  }

  function commitTheme(next: ThemeName, origin: RevealOrigin | null) {
    persistPreference(next);
    withReveal(origin, () => {
      themePreference = next;
    });
  }

  /**
   * Picking a colour persists it before the wipe, and the wipe grows from the
   * swatch that was clicked, so the palette reads as one gesture.
   */
  function selectAccent(next: AccentId, event?: MouseEvent) {
    if (next === accent) return;
    persistAccent(next);
    withReveal(resolveRevealOrigin(event, centerOf(event?.currentTarget ?? null)), () => {
      accentPreference = next;
    });
  }
  function selectTheme(next: ThemeName, event?: MouseEvent) {
    if (next === theme) {
      // Picking the theme that is already showing still turns "follow the
      // system" into an explicit choice, but nothing needs to animate.
      persistPreference(next);
      themePreference = next;
      return;
    }
    commitTheme(next, resolveRevealOrigin(event, centerOf(event?.currentTarget ?? null)));
  }

  function toggleTheme(event?: MouseEvent) {
    selectTheme(nextTheme(theme), event);
  }

  onMount(() => {
    const savedLocale = localStorage.getItem('xiaozhe-locale');
    if (savedLocale === 'en' || savedLocale === 'zh-CN') i18n.setLocale(savedLocale);

    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    // The pre-paint script already painted this state; releasing the guard only
    // now keeps transitions suppressed until hydration has caught up.
    document.documentElement.classList.remove('theme-initializing');

    const handleSystemChange = (event: MediaQueryListEvent) => {
      // Feeding systemDark is always safe: resolveTheme ignores it as soon as an
      // explicit choice exists, so the system can never override a picked theme.
      systemDark = event.matches;
    };
    mediaQuery.addEventListener('change', handleSystemChange);

    // Another tab changed (or cleared) the choice: an explicit value syncs as an
    // explicit choice, a removed key goes back to following the system.
    const handleStorage = (event: StorageEvent) => {
      if (event.key === ACCENT_STORAGE_KEY) {
        accentPreference = parseStoredAccent(event.newValue).accent;
        return;
      }
      if (event.key !== THEME_STORAGE_KEY) return;
      themePreference = parseStoredTheme(event.newValue).preference;
    };
    window.addEventListener('storage', handleStorage);

    // Images and links are not draggable: one delegated guard covers static and rendered markup.
    const handleDragStart = (event: DragEvent) => {
      const target = event.target;
      if (target instanceof Element && (target.closest('img') || target.closest('a'))) event.preventDefault();
    };
    document.addEventListener('dragstart', handleDragStart);

    return () => {
      mediaQuery?.removeEventListener('change', handleSystemChange);
      window.removeEventListener('storage', handleStorage);
      document.removeEventListener('dragstart', handleDragStart);
    };
  });
</script>

<!-- The layout keeps only what is identical on every page. Titles, descriptions
     and social cards belong to the page itself, so a page can never end up
     advertising the homepage description to a search engine. -->
<svelte:head>
  <meta name="theme-color" content={dark ? '#0d1016' : '#fafbfc'} />
  <meta name="color-scheme" content="light dark" />
  <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png" />
  <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
  <link rel="apple-touch-icon" href={APPLE_TOUCH_ICON} />
  <link rel="manifest" href={MANIFEST_PATH} />
  <link rel="alternate" type="application/rss+xml" title="Xiaozhe" href={FEED_PATH} />
  <meta name="application-name" content={SITE_NAME} />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-title" content={SITE_NAME} />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
</svelte:head>

{#key $i18n}
  <Header {dark} followingSystem={themePreference === null} {accent} {selectAccent} {toggleTheme} />

  {#key `${page.url.pathname}${page.url.search}`}
    <main class="site-main page-enter">
      {@render children?.()}
    </main>
  {/key}

  <Footer />
  <NavigationProgress />
{/key}

<ImageViewer />
