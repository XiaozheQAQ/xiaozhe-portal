<script lang="ts">
  import { useI18n } from '#lib/i18n';
  import { projectUrl, type LabProject } from './projects';

  let { project }: { project: LabProject } = $props();
  const { locale } = useI18n();
</script>

<a class="lab-project" class:in-development={project.status === 'development'} href={projectUrl(project)}>
  <div class="lab-project-top">
    <span class="lab-project-icon"><i class={project.icon} aria-hidden="true"></i></span>
    <span class="lab-project-arrow"><i class="ri-arrow-right-up-line" aria-hidden="true"></i></span>
  </div>
  <h3>{project.title}</h3>
  <p>{project.description[$locale]}</p>
  <ul class="lab-project-tech">
    {#each project.tech as tech (tech)}
      <li>{tech}</li>
    {/each}
  </ul>
  <div class="lab-project-repo">
    <i class="ri-github-line" aria-hidden="true"></i>
    <span>{project.repository}</span>
  </div>
</a>
