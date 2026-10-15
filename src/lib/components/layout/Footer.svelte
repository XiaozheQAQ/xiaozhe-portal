<script lang="ts">
  import { useI18n } from '#lib/i18n';
  const i18n = useI18n();
</script>

<footer class="border-t border-[var(--line)] px-5 py-8 sm:px-8 lg:px-10" data-locale={$i18n}>
  <div class="mx-auto flex max-w-[1200px] flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-10">
    <div class="min-w-0">
      <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span class="font-mono text-sm font-bold tracking-[0.08em]">Xiaozhe Nice</span>
        <a
          class="group inline-flex items-center gap-1.5 text-xs leading-none tracking-[0.02em] text-[var(--muted)] transition-colors hover:text-[var(--text)]"
          href="https://beian.miit.gov.cn/"
          target="_blank"
          rel="noreferrer"
          title={i18n.t('footer.icpTitle')}
        >
          <img
            class="h-5 w-5 shrink-0 rounded-[4px] opacity-80 transition-opacity duration-200 group-hover:opacity-100"
            src="/miit.ico"
            alt=""
            width="20"
            height="20"
            loading="lazy"
            decoding="async"
          />
          <span>皖ICP备2026035559号-1</span>
        </a>
      </div>
      <p class="mt-2 max-w-[52ch] text-sm text-[var(--muted)]">{i18n.t('footer.tagline')}</p>
    </div>
    <div class="flex shrink-0 flex-col gap-2 text-sm text-[var(--muted)] sm:items-end">
      <div class="flex gap-4">
        <a href="https://github.com/XiaozheQAQ" target="_blank" rel="noreferrer" class="transition-colors hover:text-[var(--text)]">GitHub</a>
        <a href="/feed.xml" class="transition-colors hover:text-[var(--text)]">{i18n.t('footer.rss')}</a>
      </div>
      <div class="text-xs">© 2026 Xiaozhe Nice</div>
    </div>
  </div>
</footer>
