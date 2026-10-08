<script lang="ts">
  import { useI18n } from '#lib/i18n';
  import { page } from '$app/state';
  import { fly } from 'svelte/transition';

  let { dark, themeMode, toggleTheme }: { dark: boolean; themeMode: 'system' | 'light' | 'dark'; toggleTheme: () => void } = $props();
  const i18n = useI18n();
  let menuOpen = $state(false);
  let languageOpen = $state(false);
  const locale = i18n.locale;
  const links = [
    { href: '/', key: 'nav.home' },
    { href: '/blog', key: 'nav.blog' },
    { href: '/projects', key: 'nav.projects' },
    { href: '/lab', key: 'nav.lab' },
    { href: '/about', key: 'nav.about' }
  ];
  const themeLabels = {
    system: 'theme.system',
    light: 'theme.light',
    dark: 'theme.dark'
  };

  function selectLocale(locale: 'zh-CN' | 'en') {
    i18n.setLocale(locale);
    languageOpen = false;
  }

  function handleWindowClick(event: MouseEvent) {
    const target = event.target;
    if (target instanceof Element && !target.closest('.language-control')) languageOpen = false;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      languageOpen = false;
      menuOpen = false;
    }

  }
</script>

<svelte:window on:click={handleWindowClick} on:keydown={handleKeydown} />

<header class="site-header">
  <div class="header-inner">
    <a href="/" class="brand" aria-label="Xiaozhe home">
      <img class="brand-avatar" src="/images/xiaozhe-avatar.jpg" alt="Xiaozhe Nice" />
      <span class="brand-name">Xiaozhe Nice</span>
      <span class="brand-section">{i18n.t('brand.blog')}</span>
    </a>
    <nav class="desktop-nav" aria-label="Primary navigation">
      {#each links as link}
        <a class:active={link.href !== '/' ? page.url.pathname.startsWith(link.href) : page.url.pathname === '/'} href={link.href}>{i18n.t(link.key)}</a>
      {/each}
    </nav>
    <div class="header-actions">
      <button class="icon-button theme-button" onclick={toggleTheme} aria-label={i18n.t(themeLabels[themeMode])} title={i18n.t(themeLabels[themeMode])}>
        <i class={`theme-icon ${themeMode === 'system' ? 'ri-computer-line' : themeMode === 'light' ? 'ri-sun-line' : 'ri-moon-line'}`} aria-hidden="true"></i>
      </button>
      <button class="menu-button compact-button" onclick={() => (menuOpen = !menuOpen)} aria-expanded={menuOpen} aria-label={i18n.t('nav.menu')}>{i18n.t('nav.menu')}</button>
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
        <a href={link.href} onclick={() => (menuOpen = false)}>{i18n.t(link.key)}<span>↗</span></a>
      {/each}
      <a href="/search" onclick={() => (menuOpen = false)}>{i18n.t('nav.search')}<i class="ri-search-line" aria-hidden="true"></i></a>
      <a href="https://github.com/XiaozheQAQ" target="_blank" rel="noreferrer" onclick={() => (menuOpen = false)}>GitHub <i class="ri-github-line" aria-hidden="true"></i></a>
      <div class="mobile-menu-controls">
        <button onclick={() => selectLocale('zh-CN')} class:selected={$locale === 'zh-CN'}>中文</button>
        <button onclick={() => selectLocale('en')} class:selected={$locale === 'en'}>English</button>
        <button onclick={toggleTheme}><i class={themeMode === 'system' ? 'ri-computer-line' : themeMode === 'light' ? 'ri-sun-line' : 'ri-moon-line'} aria-hidden="true"></i> {i18n.t(themeLabels[themeMode])}</button>
      </div>
    </nav>
  {/if}
</header>
