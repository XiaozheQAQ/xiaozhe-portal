<script lang="ts">
  import { useI18n } from '#lib/i18n';
  const i18n = useI18n();
</script>

<footer class="border-t border-[var(--line)] px-5 py-8 sm:px-8 lg:px-10" data-locale={$i18n}>
  <div class="mx-auto flex max-w-[1200px] flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <div class="font-mono text-sm font-bold tracking-[0.08em]">Xiaozhe Nice</div>
      <p class="mt-2 text-sm text-[var(--muted)]">{i18n.t('footer.tagline')}</p>
    </div>
    <div class="text-left text-sm text-[var(--muted)] sm:text-right">
      <div class="flex gap-4 sm:justify-end">
        <a href="https://github.com/XiaozheQAQ" target="_blank" rel="noreferrer" class="hover:text-[var(--text)]">GitHub</a>
        <a href="/feed.xml" class="hover:text-[var(--text)]">{i18n.t('footer.rss')}</a>
      </div>
      <div class="mt-3">© 2026 Xiaozhe</div>
    </div>
  </div>
</footer>
