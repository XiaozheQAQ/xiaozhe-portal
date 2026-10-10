<script lang="ts">
  import { useI18n } from '#lib/i18n';
  let { item }: {
    item: { slug: string; data: { title: string; description: string; status: string; date: string } };
  } = $props();
  const i18n = useI18n();
  const locale = i18n.locale;

  const state = {
    researching: ['◐', 'lab.researching'],
    done: ['✓', 'lab.done']
  } as Record<string, [string, string]>;
</script>

<a href={`/lab/${item.slug}`} data-locale={$locale} class="group block rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 transition hover:-translate-y-0.5 hover:border-[var(--accent-ink)] hover:bg-[var(--accent-soft)]">
  <div class="flex items-center justify-between gap-3">
    <span class="text-xs text-[var(--muted)]">{state[item.data.status]?.[0] ?? '•'} {i18n.t(state[item.data.status]?.[1] ?? item.data.status)}</span>
    <time class="font-mono text-[11px] text-[var(--muted)]">{item.data.date}</time>
  </div>
  <h3 class="mt-7 text-base font-semibold tracking-[-0.02em] group-hover:text-[var(--accent-ink)]">{item.data.title}</h3>
  <p class="mt-2 line-clamp-2 text-sm leading-6 text-[var(--muted)]">{item.data.description}</p>
  <i class="ri-arrow-right-line mt-3 inline-flex text-[var(--accent-ink)] transition-transform group-hover:translate-x-1" aria-hidden="true"></i>
</a>
