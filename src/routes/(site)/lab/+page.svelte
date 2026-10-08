<script lang="ts">
  import LabItem from '#lib/features/lab/LabItem.svelte';
  import { useI18n } from '#lib/i18n';
  let { data } = $props();
  const i18n = useI18n();
  const locale = i18n.locale;
  const statusKeys: Record<string, string> = {
    active: 'status.active',
    experimental: 'status.experimental',
    done: 'status.done',
    archived: 'status.archived'
  };
</script>

<svelte:head><title>{i18n.t('page.lab')} — Xiaozhe</title><meta name="language" content={$i18n} /></svelte:head>

<section class="pb-12 pt-10 lg:pt-16" data-locale={$locale}>
  <p class="eyebrow">Experiments, notes, and unfinished questions</p>
  <h1 class="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">{i18n.t('page.lab')}</h1>
  <p class="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">{i18n.t('page.labDescription')}</p>
</section>

<section class="lab-index">
  {#each data.labs as item, index}
    <a class="lab-card group" href={`/lab/${item.slug}`}>
      <span class="lab-card-index">{String(index + 1).padStart(2, '0')}</span>
      <div>
        <div class="lab-card-meta">
          <span class="lab-card-status">{i18n.t(statusKeys[item.data.status] ?? item.data.status)}</span>
          <time>{item.data.date}</time>
        </div>
        <h2 class="lab-card-title group-hover:text-[var(--accent)]">{item.data.title}</h2>
        <p class="lab-card-description">{item.data.description}</p>
      </div>
      <i class="ri-arrow-right-line text-[var(--accent)]" aria-hidden="true"></i>
    </a>
  {/each}
</section>
