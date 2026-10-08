<script lang="ts">
  import '../../app.css';
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { createI18n } from '#lib/i18n';
  import Header from '#lib/components/layout/Header.svelte';
  import Footer from '#lib/components/layout/Footer.svelte';
  import NavigationProgress from '#lib/components/common/NavigationProgress.svelte';

  let { children } = $props();
  const i18n = createI18n();
  type ThemeMode = 'system' | 'light' | 'dark';
  let themeMode = $state<ThemeMode>('system');
  let dark = $state(false);
  let mediaQuery: MediaQueryList | undefined;

  function applyTheme(mode: ThemeMode) {
    const prefersDark = mediaQuery?.matches ?? window.matchMedia('(prefers-color-scheme: dark)').matches;
    dark = mode === 'dark' || (mode === 'system' && prefersDark);
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.dataset.theme = mode;
  }

  onMount(() => {
    const savedLocale = localStorage.getItem('xiaozhe-locale');
    if (savedLocale === 'en' || savedLocale === 'zh-CN') i18n.setLocale(savedLocale);
    const savedTheme = localStorage.getItem('xiaozhe-theme');
    if (savedTheme === 'system' || savedTheme === 'light' || savedTheme === 'dark') themeMode = savedTheme;
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    applyTheme(themeMode);
    document.documentElement.classList.remove('theme-initializing');
    const handleSystemChange = () => { if (themeMode === 'system') applyTheme('system'); };
    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery?.removeEventListener('change', handleSystemChange);
  });

  function toggleTheme() {
    themeMode = themeMode === 'system' ? 'light' : themeMode === 'light' ? 'dark' : 'system';
    applyTheme(themeMode);
    localStorage.setItem('xiaozhe-theme', themeMode);
  }
</script>

<svelte:head>
  <meta name="description" content="Xiaozhe's personal web portal — writing, projects and experiments." />
  <meta name="theme-color" content={dark ? '#0d1016' : '#fafbfc'} />
  <link rel="icon" type="image/jpeg" href="/images/xiaozhe-avatar.jpg" />
  <link rel="apple-touch-icon" href="/images/xiaozhe-avatar.jpg" />
  <link rel="canonical" href={`https://xiaozhe.dev${page.url.pathname}`} />
  <meta property="og:title" content="Xiaozhe — Web / AI / Systems" />
  <meta property="og:description" content="Writing, projects and experiments from Xiaozhe." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={`https://xiaozhe.dev${page.url.pathname}`} />
</svelte:head>

{#key $i18n}
  <Header {dark} {themeMode} {toggleTheme} />

  {#key `${page.url.pathname}${page.url.search}`}
    <main class="site-main page-enter">
      {@render children?.()}
    </main>
  {/key}

  <Footer />
  <NavigationProgress />
{/key}
