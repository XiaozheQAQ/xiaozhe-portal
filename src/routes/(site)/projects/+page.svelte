<script lang="ts">
  import ProjectItem from '#lib/features/projects/ProjectItem.svelte';
  import { useI18n } from '#lib/i18n';
  let { data } = $props();
  const i18n = useI18n();
  const locale = i18n.locale;
</script>

<svelte:head><title>{i18n.t('page.projects')} — Xiaozhe</title><meta name="language" content={$i18n} /></svelte:head>

<section class="pb-12 pt-10 lg:pt-16" data-locale={$locale}>
  <p class="eyebrow">Things I keep working on</p>
  <h1 class="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">{i18n.t('page.projects')}</h1>
  <p class="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">{i18n.t('page.projectsDescription')}</p>
</section>

<section class="border-t border-[var(--line)]">{#each data.projects as project}<ProjectItem {project} />{/each}</section>
