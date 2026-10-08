<script lang="ts">
  import { useI18n } from '#lib/i18n';
  const i18n = useI18n();
</script>

<svelte:head><title>{i18n.t('page.about')} — Xiaozhe</title><meta name="language" content={$i18n} /></svelte:head>

<section class="pb-10 pt-8 lg:pt-12">
  <p class="eyebrow">{i18n.t('page.about')}</p>
  <h1 class="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">{i18n.t('page.aboutTitle')}</h1>
</section>

<section class="grid gap-8 border-t border-[var(--line)] py-8 lg:grid-cols-[.7fr_1.3fr]">
  <div class="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{ $i18n === 'zh-CN' ? 'Who I am' : 'Who I am' }</div>
  <div class="prose max-w-[760px]">
    {#if $i18n === 'zh-CN'}
      <p>这部分我想留给自己来写，不先用一段看起来完整的话代替真实介绍。</p>
      <p>目前可以确认的是：这里记录文章、项目和实验，也收留一些还没有想清楚的东西。</p>
    {:else}
      <p>I want to write this part myself rather than replace a real introduction with polished filler.</p>
      <p>For now, the confirmed purpose is simple: this site holds writing, projects, experiments, and things I have not figured out yet.</p>
    {/if}
  </div>
</section>

<section class="grid gap-8 border-t border-[var(--line)] py-8 lg:grid-cols-[.7fr_1.3fr]">
  <div class="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{ $i18n === 'zh-CN' ? 'What I build' : 'What I build' }</div>
  <div class="prose max-w-[760px]">
    {#if $i18n === 'zh-CN'}
      <p>这里会放已经做过的 Web 应用、桌面实验、基础设施项目，以及还在验证中的 Lab 内容。</p>
    {:else}
      <p>This site collects web applications, desktop experiments, infrastructure projects, and smaller ideas that are not ready to be projects yet.</p>
    {/if}
  </div>
</section>

<section class="grid gap-8 border-t border-[var(--line)] py-8 lg:grid-cols-[.7fr_1.3fr]">
  <div class="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{ $i18n === 'zh-CN' ? 'What I am learning' : 'What I am learning' }</div>
  <div class="prose max-w-[760px]">
    {#if $i18n === 'zh-CN'}
      <p>这部分需要我继续补充目前真正正在学习的内容，不先替自己列一份看起来合理的清单。</p>
    {:else}
      <p>I still need to write down what I am actually learning instead of presenting an assumed list.</p>
    {/if}
  </div>
</section>

<section class="grid gap-8 border-t border-[var(--line)] py-8 lg:grid-cols-[.7fr_1.3fr]">
  <div class="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{ $i18n === 'zh-CN' ? 'What I explore' : 'What I explore' }</div>
  <div class="prose max-w-[760px]">
    {#if $i18n === 'zh-CN'}
      <p>实验室会留下网络、Linux 服务、系统设计，以及那些需要先动手才能理解的问题。</p>
    {:else}
      <p>The lab is for networks, Linux services, system design, and questions that only become clear after building something.</p>
    {/if}
  </div>
</section>

<section class="grid gap-8 border-t border-[var(--line)] py-8 lg:grid-cols-[.7fr_1.3fr]">
  <div class="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{ $i18n === 'zh-CN' ? 'Tech' : 'Tech' }</div>
  <div class="flex flex-wrap gap-2">
    {#each ['JavaScript', 'TypeScript', 'Python', 'Node.js', 'SvelteKit', 'Electron', 'Linux', 'AI tooling'] as item}
      <span class="tag">{item}</span>
    {/each}
  </div>
</section>

<section class="grid gap-8 border-t border-[var(--line)] py-8 lg:grid-cols-[.7fr_1.3fr]">
  <div class="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Contact</div>
  <div class="prose max-w-[760px]">
    <a href="https://github.com/XiaozheQAQ" target="_blank" rel="noreferrer">GitHub — Xiaozhe Nice</a>
  </div>
</section>
