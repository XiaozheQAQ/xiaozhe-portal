<script lang="ts">
  import { useI18n } from '#lib/i18n';
  import { page } from '$app/state';
  import { cubicIn, cubicOut } from 'svelte/easing';
  import { fly, scale } from 'svelte/transition';
  import ProgressiveImage from '#lib/components/common/ProgressiveImage.svelte';
  import { ACCENTS, accentLabelKey, swatchColor, type AccentId } from '#lib/theme/accent';

  let { dark, followingSystem, accent, selectAccent, toggleTheme }: {
    dark: boolean;
    followingSystem: boolean;
    accent: AccentId;
    selectAccent: (accent: AccentId, event?: MouseEvent) => void;
    toggleTheme: (event?: MouseEvent) => void;
  } = $props();
  const i18n = useI18n();
  let menuOpen = $state(false);
  let languageOpen = $state(false);
  let accentOpen = $state(false);
  let accentButton = $state<HTMLButtonElement>();
  let accentPopover = $state<HTMLDivElement>();
  /** The palette grid inside the mobile menu, which needs its own focus handling. */
  let menuColors = $state<HTMLDivElement>();
  let accentPos = $state({ left: 0, top: 0 });
  /** False until the panel has been measured where it is about to appear. */
  let accentReady = $state(false);
  const locale = i18n.locale;
  const links = [
    { href: '/', key: 'nav.home', icon: 'ri-home-4-line' },
    { href: '/blog', key: 'nav.blog', icon: 'ri-article-line' },
    { href: '/lab', key: 'nav.lab', icon: 'ri-flask-line' },
    { href: '/status', key: 'nav.status', icon: 'ri-pulse-line' },
    { href: '/about', key: 'nav.about', icon: 'ri-user-3-line' }
  ];
  // The switch keeps a stable accessible name and reports its state through
  // aria-checked; the title spells out the current theme and what a click does.
  const themeState = $derived(dark ? 'theme.dark' : 'theme.light');
  const themeAction = $derived(dark ? 'theme.switchToLight' : 'theme.switchToDark');
  const themeTitle = $derived(
    `${i18n.t(themeState)}${followingSystem ? ` · ${i18n.t('theme.system')}` : ''} · ${i18n.t(themeAction)}`
  );

  /*
   * The panel pops out of its button and retracts into it again. Reduced motion
   * keeps the state change and drops the movement, the same deal the page has.
   */
  let motionOk = $state(true);
  $effect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => (motionOk = !query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  });
  const popIn = $derived(motionOk ? { start: 0.94, duration: 180, opacity: 0, easing: cubicOut } : { duration: 0 });
  const popOut = $derived(motionOk ? { start: 0.96, duration: 120, opacity: 0, easing: cubicIn } : { duration: 0 });

  const accentName = $derived(i18n.t(accentLabelKey(accent)));
  const accentTitle = $derived(`${i18n.t('accent.label')} · ${accentName}`);

  /*
   * The palette panel is fixed and placed from the button's own rect: fixed
   * keeps it out of the header's flow, so opening it never nudges the page, and
   * the clamped coordinates keep it inside the viewport on a phone. It is
   * placed before it is mounted and re-measured once it exists (so its real
   * size is used), then again on resize and scroll, so a moving button, a
   * rotation or a scroll cannot strand it off screen.
   */
  function placeAccent() {
    if (!accentButton) return;
    const rect = accentButton.getBoundingClientRect();
    const width = accentPopover?.offsetWidth || 208;
    const height = accentPopover?.offsetHeight || 236;
    const below = rect.bottom + 8;
    accentPos = {
      left: Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8)),
      top: below + height > window.innerHeight - 8 ? Math.max(8, rect.top - height - 8) : below
    };
  }

  $effect(() => {
    if (!accentOpen || !accentButton) return;
    placeAccent();
    accentReady = true;
    window.addEventListener('resize', placeAccent);
    window.addEventListener('scroll', placeAccent, { passive: true });
    return () => {
      window.removeEventListener('resize', placeAccent);
      window.removeEventListener('scroll', placeAccent);
    };
  });

  function openAccent() {
    accentReady = false;
    placeAccent();
    accentOpen = true;
  }

  /** Opening with the keyboard should not cost a second Tab to reach the grid. */
  $effect(() => {
    if (!accentOpen) return;
    accentPopover?.querySelector<HTMLButtonElement>('.accent-swatch.selected')?.focus();
  });

  /**
   * Arrows walk the palette row/grid wise (both grids are four columns wide);
   * Enter or Space on a swatch applies it. The container is passed in because
   * the same palette appears in the popover and in the mobile menu.
   */
  function handleAccentKeys(event: KeyboardEvent, container: HTMLElement | undefined) {
    const step: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 4, ArrowUp: -4 };
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      focusSwatch(event.key === 'Home' ? 0 : ACCENTS.length - 1, container);
      return;
    }
    if (!step[event.key]) return;
    event.preventDefault();
    const current = ACCENTS.findIndex((option) => option.id === accent);
    focusSwatch((current + step[event.key] + ACCENTS.length) % ACCENTS.length, container);
  }

  function focusSwatch(index: number, container: HTMLElement | undefined) {
    container?.querySelectorAll<HTMLButtonElement>('.accent-swatch')[index]?.focus();
  }

  function closeAccent(restoreFocus = false) {
    accentOpen = false;
    accentReady = false;
    if (restoreFocus) accentButton?.focus();
  }

  function selectLocale(locale: 'zh-CN' | 'en') {
    i18n.setLocale(locale);
    languageOpen = false;
  }

  function handleWindowClick(event: MouseEvent) {
    const target = event.target;
    if (target instanceof Element && !target.closest('.language-control')) languageOpen = false;
    if (target instanceof Element && !target.closest('.accent-control')) accentOpen = false;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      languageOpen = false;
      menuOpen = false;
      if (accentOpen) closeAccent(true);
    }

  }
</script>

<svelte:window on:click={handleWindowClick} on:keydown={handleKeydown} />

<header class="site-header">
  <div class="header-inner">
    <a href="/" class="brand" aria-label="Xiaozhe home">
      <ProgressiveImage class="brand-avatar" src="/images/xiaozhe-avatar.jpg" alt="Xiaozhe Nice" width={32} height={32} priority spinnerSize={16} />
      <span class="brand-name">Xiaozhe Nice</span>
      <span class="brand-section">{i18n.t('brand.blog')}</span>
    </a>
    <nav class="desktop-nav" aria-label="Primary navigation">
      {#each links as link}
        <a class:active={link.href !== '/' ? page.url.pathname.startsWith(link.href) : page.url.pathname === '/'} href={link.href}>
          <i class={link.icon} aria-hidden="true"></i>{i18n.t(link.key)}
        </a>
      {/each}
    </nav>
    <div class="header-actions">
      <div class="accent-control">
        <button
          class="icon-button accent-button"
          bind:this={accentButton}
          onclick={() => (accentOpen ? closeAccent() : openAccent())}
          aria-expanded={accentOpen}
          aria-haspopup="dialog"
          aria-label={i18n.t('accent.label')}
          title={accentTitle}
        >
          <i class="ri-palette-line" aria-hidden="true"></i>
        </button>
        {#if accentOpen}
          <div
            class="accent-popover"
            bind:this={accentPopover}
            role="dialog"
            aria-label={i18n.t('accent.label')}
            data-ready={accentReady}
            style="left: {accentPos.left}px; top: {accentPos.top}px"
            in:scale={popIn}
            out:scale={popOut}
          >
            <span class="accent-popover-title">{i18n.t('accent.label')}</span>
            <div class="accent-grid" role="radiogroup" tabindex="-1" aria-label={i18n.t('accent.label')} onkeydown={(event) => handleAccentKeys(event, accentPopover)}>
              {#each ACCENTS as option}
                <button
                  class="accent-swatch"
                  class:selected={accent === option.id}
                  role="radio"
                  aria-checked={accent === option.id}
                  aria-label={i18n.t(accentLabelKey(option.id))}
                  title={i18n.t(accentLabelKey(option.id))}
                  tabindex={accent === option.id ? 0 : -1}
                  style="--swatch: {swatchColor(option)}"
                  onclick={(event) => selectAccent(option.id, event)}
                >
                  <span class="accent-dot" aria-hidden="true"></span>
                </button>
              {/each}
            </div>
          </div>
        {/if}
      </div>
      <button
        class="icon-button theme-button"
        onclick={(event) => toggleTheme(event)}
        role="switch"
        aria-checked={dark}
        aria-label={i18n.t('theme.darkMode')}
        title={themeTitle}
        data-theme-state={dark ? 'dark' : 'light'}
      >
        <i class="theme-icon theme-icon-light ri-sun-line" aria-hidden="true"></i>
        <i class="theme-icon theme-icon-dark ri-moon-line" aria-hidden="true"></i>
      </button>
      <button class="menu-button icon-button" onclick={() => (menuOpen = !menuOpen)} aria-expanded={menuOpen} aria-label={i18n.t(menuOpen ? 'nav.closeMenu' : 'nav.menu')}>
        <i class={menuOpen ? 'ri-close-line' : 'ri-menu-line'} aria-hidden="true"></i>
      </button>
      <div class="language-control">
        <button class="language-trigger compact-button" onclick={() => (languageOpen = !languageOpen)} aria-expanded={languageOpen} aria-haspopup="menu">
          {$locale === 'zh-CN' ? '中文' : 'English'} <i class:open={languageOpen} class="ri-arrow-down-s-line" aria-hidden="true"></i>
        </button>
        {#if languageOpen}
          <div class="language-menu" transition:fly={{ y: -4, duration: 180 }} role="menu">
            <button class:selected={$locale === 'zh-CN'} onclick={() => selectLocale('zh-CN')} role="menuitem">中文 <span>{$locale === 'zh-CN' ? '✓' : ''}</span></button>
            <button class:selected={$locale === 'en'} onclick={() => selectLocale('en')} role="menuitem">English <span>{$locale === 'en' ? '✓' : ''}</span></button>
          </div>
        {/if}
      </div>
    </div>
  </div>
  {#if menuOpen}
    <nav class="mobile-nav" aria-label="Mobile navigation">
      {#each links as link}
        <a href={link.href} onclick={() => (menuOpen = false)}><span><i class={link.icon} aria-hidden="true"></i>{i18n.t(link.key)}</span><span>↗</span></a>
      {/each}
      <a href="/search" onclick={() => (menuOpen = false)}>{i18n.t('nav.search')}<i class="ri-search-line" aria-hidden="true"></i></a>
      <a href="https://github.com/XiaozheQAQ" target="_blank" rel="noreferrer" onclick={() => (menuOpen = false)}>GitHub <i class="ri-github-line" aria-hidden="true"></i></a>
      <div class="mobile-menu-controls">
        <button onclick={() => selectLocale('zh-CN')} class:selected={$locale === 'zh-CN'}>中文</button>
        <button onclick={() => selectLocale('en')} class:selected={$locale === 'en'}>English</button>
        <!-- The header switch already covers light/dark, so the menu carries the
             palette instead: one control per job, and the colour picker is
             reachable where the other menu-only controls live. -->
        <div class="mobile-menu-colors">
          <span class="mobile-menu-colors-label">{i18n.t('accent.label')}</span>
          <div
            class="accent-grid"
            bind:this={menuColors}
            role="radiogroup"
            tabindex="-1"
            aria-label={i18n.t('accent.label')}
            onkeydown={(event) => handleAccentKeys(event, menuColors)}
          >
            {#each ACCENTS as option}
              <button
                class="accent-swatch"
                class:selected={accent === option.id}
                role="radio"
                aria-checked={accent === option.id}
                aria-label={i18n.t(accentLabelKey(option.id))}
                title={i18n.t(accentLabelKey(option.id))}
                tabindex={accent === option.id ? 0 : -1}
                style="--swatch: {swatchColor(option)}"
                onclick={(event) => selectAccent(option.id, event)}
              >
                <span class="accent-dot" aria-hidden="true"></span>
              </button>
            {/each}
          </div>
        </div>
      </div>
    </nav>
  {/if}
</header>