<script lang="ts">
  import SectionHeader from '#lib/components/common/SectionHeader.svelte';
  import PostItem from '#lib/features/blog/PostItem.svelte';
  import LabItem from '#lib/features/lab/LabItem.svelte';
  import { useI18n } from '#lib/i18n';
  import SearchBox from '#lib/components/common/SearchBox.svelte';

  let { data } = $props();
  const i18n = useI18n();
  const locale = i18n.locale;
</script>

<svelte:head>
  <title>{i18n.t('hero.title')} — Xiaozhe</title>
  <meta name="language" content={$i18n} />
</svelte:head>

<div data-locale={$locale}>
<section class="hero-grid">
  <div class="hero-copy">
    <div class="eyebrow">{i18n.t('hero.eyebrow')}</div>
    <h1 class:hero-title-zh={$locale === 'zh-CN'} class="hero-title">{i18n.t('hero.title')}</h1>
    <p class="hero-subtitle">{i18n.t('hero.subtitle')}</p>
    <div class="hero-tags">
      {#each ['Web', 'AI', 'Systems', 'Minecraft'] as tag}<a class="tag" href="/search">{tag}</a>{/each}
    </div>
    <div class="hero-actions">
      <a class="button-primary" href="/lab">{i18n.t('hero.ctaLab')} <i class="ri-arrow-right-up-line" aria-hidden="true"></i></a>
      <a class="button-secondary" href="/blog">{i18n.t('hero.ctaWriting')} <i class="ri-arrow-right-line" aria-hidden="true"></i></a>
    </div>
  </div>
  <aside class="status-panel">
    <div class="eyebrow">{i18n.t('hero.current')}</div>
    <dl>
      <div><dt>{i18n.t('hero.building')}</dt><dd>{i18n.t('hero.buildingValue')}</dd></div>
      <div><dt>{i18n.t('hero.learning')}</dt><dd>{i18n.t('hero.learningValue')}</dd></div>
      <div><dt>{i18n.t('hero.exploring')}</dt><dd>{i18n.t('hero.exploringValue')}</dd></div>
    </dl>
    <div class="mt-5 border-t border-[var(--line)] pt-4 font-mono text-[11px] text-[var(--muted)]">{i18n.t('hero.updated')}</div>
  </aside>
</section>

<div class="now-line"><strong>Now</strong>{i18n.t('home.now')}</div>

<SearchBox className="home-search" />

<nav class="quick-grid" aria-label={i18n.t('home.quick')}>
  <a class="quick-link" href="/blog"><span class="quick-link-label"><i class="ri-article-line" aria-hidden="true"></i>{i18n.t('home.quickWriting')}</span><span>↗</span></a>
  <a class="quick-link" href="/lab"><span class="quick-link-label"><i class="ri-flask-line" aria-hidden="true"></i>{i18n.t('home.quickLab')}</span><span>↗</span></a>
  <a class="quick-link" href="/status"><span class="quick-link-label"><i class="ri-pulse-line" aria-hidden="true"></i>{i18n.t('home.quickStatus')}</span><span>↗</span></a>
</nav>

<section class="content-section">
  <SectionHeader title={i18n.t('section.writing')} href="/blog" action={i18n.t('section.viewAll')} />
  <div>{#each data.posts as post, index}<PostItem {post} index={index} />{/each}</div>
</section>

<section class="content-section">
  <SectionHeader title={i18n.t('section.lab')} href="/lab" action={i18n.t('section.viewAll')} />
  <div class="grid gap-2 md:grid-cols-3">{#each data.labs as item}<LabItem {item} />{/each}</div>
</section>
</div>
