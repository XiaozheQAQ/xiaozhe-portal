<script lang="ts">
  import { useI18n } from '#lib/i18n';
  let { project }: {
    project: { slug: string; data: { title: string; description: string; tech: string[]; status: string } };
  } = $props();
  const i18n = useI18n();
  const locale = i18n.locale;
</script>

<a href={`/projects/${project.slug}`} data-locale={$locale} class="group block border-t border-[var(--line)] px-2 py-4 transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] first:border-t-0">
  <div class="flex items-start justify-between gap-6">
    <div class="min-w-0">
      <div class="flex flex-wrap items-center gap-3">
        <h3 class="text-base font-semibold tracking-[-0.025em] transition group-hover:text-[var(--accent)]">{project.data.title}</h3>
        <span class="rounded-full border border-[var(--line)] px-2 py-0.5 text-[10px] text-[var(--muted)]">{i18n.t(`status.${project.data.status}`)}</span>
      </div>
      <p class="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">{project.data.description}</p>
      <div class="mt-4 flex flex-wrap gap-3">
        {#each project.data.tech as tech}
          <span class="font-mono text-[11px] text-[var(--muted)]">{tech}</span>
        {/each}
      </div>
    </div>
    <i class="ri-arrow-right-up-line mt-1 shrink-0 text-[var(--accent)] transition-transform group-hover:translate-x-1" aria-hidden="true"></i>
  </div>
</a>
