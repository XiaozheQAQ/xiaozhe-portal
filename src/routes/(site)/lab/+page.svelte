<script lang="ts">
  import LabItem from '#lib/features/lab/LabItem.svelte';
  import { useI18n } from '#lib/i18n';
  let { data } = $props();
  const i18n = useI18n();
  const locale = i18n.locale;
  const groups = [
    { id: 'researching', key: 'lab.researching' },
    { id: 'done', key: 'lab.done' }
  ];
</script>

<svelte:head><title>{i18n.t('page.lab')} — Xiaozhe</title><meta name="language" content={$i18n} /></svelte:head>

<section class="pb-12 pt-5 lg:pt-7" data-locale={$locale}>
  <p class="eyebrow">{i18n.t('lab.eyebrow')}</p>
  <h1 class="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">{i18n.t('page.lab')}</h1>
  <p class="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">{i18n.t('page.labDescription')}</p>
</section>

{#each groups as group}
  {@const items = data.labs.filter((item) => item.data.status === group.id)}
  <section id={group.id} class="lab-group">
    <div class="lab-group-heading">
      <div>
        <p class="eyebrow"><i class={group.id === 'researching' ? 'ri-flask-line' : 'ri-checkbox-circle-line'} aria-hidden="true"></i> {i18n.t(group.key)}</p>
        <p class="lab-group-count">{items.length} {i18n.t('lab.count')}</p>
      </div>
    </div>
    {#if items.length}
      <div class="lab-index">
        {#each items as item, index}
          <a class="lab-card group" href={`/lab/${item.slug}`}>
            <span class="lab-card-index">{String(index + 1).padStart(2, '0')}</span>
            <div>
              <div class="lab-card-meta">
                <span class="lab-card-status">{i18n.t(group.key)}</span>
                {#if item.data.date}<time>{item.data.date}</time>{/if}
              </div>
              <h2 class="lab-card-title group-hover:text-[var(--accent)]">{item.data.title}</h2>
              <p class="lab-card-description">{item.data.description}</p>
              {#if item.data.tags.length}
                <div class="lab-card-tags">{#each item.data.tags as tag}<span>{tag}</span>{/each}</div>
              {/if}
            </div>
            <i class="ri-arrow-right-line text-[var(--accent)]" aria-hidden="true"></i>
          </a>
        {/each}
      </div>
    {:else}
      <p class="lab-empty">{i18n.t('lab.empty')}</p>
    {/if}
  </section>
{/each}
