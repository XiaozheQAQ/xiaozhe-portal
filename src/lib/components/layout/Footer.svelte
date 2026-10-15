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
      <a
        class="group mt-2.5 inline-flex items-center gap-1.5 text-xs leading-none tracking-[0.02em] transition-colors hover:text-[var(--text)]"
        href="https://beian.miit.gov.cn/"
        target="_blank"
        rel="noreferrer"
        title={i18n.t('footer.icpTitle')}
      >
        <img
          class="h-4 w-4 shrink-0 rounded-[3px] opacity-70 transition-opacity duration-200 group-hover:opacity-100"
          src="/miit.ico"
          alt=""
          width="16"
          height="16"
          loading="lazy"
          decoding="async"
        />
        <span>皖ICP备2026035559号-1</span>
      </a>
    </div>
  </div>
</footer>
