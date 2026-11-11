<script lang="ts">
  import { translate, useI18n } from '#lib/i18n';
  import type { LabProject } from './projects';

  let { project }: { project: LabProject } = $props();
  const { locale } = useI18n();
  const linkIcons = {
    repository: 'ri-git-repository-line',
    app: 'ri-global-line',
    software: 'ri-download-2-line'
  };
</script>

<a class="lab-project" class:in-development={project.status === 'development'} href={project.url}>
  <div class="lab-project-top">
    <span class="lab-project-icon"><i class={project.icon} aria-hidden="true"></i></span>
    <span class="lab-project-arrow"><i class="ri-arrow-right-up-line" aria-hidden="true"></i></span>
  </div>
  <h3>{project.title}</h3>
  <p>{project.description[$locale]}</p>
  <ul class="lab-project-tags">
    {#each project.tags as tag (tag)}
      <li>{tag}</li>
    {/each}
  </ul>
  <div class="lab-project-link">
    <i class={linkIcons[project.linkType]} aria-hidden="true"></i>
    <span>{translate($locale, `lab.link.${project.linkType}`)}</span>
  </div>
</a>
