<script lang="ts">
  import Seo from '#lib/components/common/Seo.svelte';
  import LabItem from '#lib/features/lab/LabItem.svelte';
  import { labProjects } from '#lib/features/lab/projects';
  import { translate, useI18n } from '#lib/i18n';

  const { locale } = useI18n();
  const title = $derived(translate($locale, 'page.lab'));
  const description = $derived(translate($locale, 'page.labDescription'));
  const groups = [
    { status: 'maintenance', anchor: 'done', icon: 'ri-checkbox-circle-line' },
    { status: 'development', anchor: 'researching', icon: 'ri-hammer-line' }
  ];
</script>

<Seo
  title={`${title} — Xiaozhe`}
  description={description}
  path="/lab"
/>

<div class="lab-showcase">
  <header class="lab-intro">
    <h1>{title}</h1>
    <p>{description}</p>
  </header>

  {#each groups as group (group.status)}
    {@const projects = labProjects.filter((project) => project.status === group.status)}
    <section id={group.anchor} class="lab-group" aria-labelledby={`lab-${group.status}`}>
      <header class="lab-group-heading">
        <h2 id={`lab-${group.status}`}>
          <i class={group.icon} aria-hidden="true"></i>
          {translate($locale, `lab.${group.status}.title`)}
        </h2>
        <p>{translate($locale, `lab.${group.status}.description`)}</p>
      </header>
      <div class="lab-project-grid">
        {#each projects as project (project.url)}
          <LabItem {project} />
        {/each}
      </div>
    </section>
  {/each}
</div>
