<script lang="ts">
  import { useI18n } from '#lib/i18n';
  import ProgressiveImage from '#lib/components/common/ProgressiveImage.svelte';
  const i18n = useI18n();

  // Tech stack categorized by domain
  const stackLanguages = [
    { name: 'TypeScript', active: true },
    { name: 'JavaScript', active: true },
    { name: 'Python', active: false },
    { name: 'C', active: false },
    { name: 'PHP', active: false },
    { name: 'C#', active: false }
  ];

  const stackWeb = [
    { name: 'SvelteKit', active: true },
    { name: 'Node.js', active: true },
    { name: 'Electron', active: false }
  ];

  const stackTools = [
    { name: 'Linux', active: false },
    { name: 'Git', active: false },
    { name: 'AI Coding Tools', active: true }
  ];

  // Interests categorized into tech/creative and other pursuits
  const techInterests = [
    { icon: 'ri-code-s-slash-line', zh: 'Web 开发与个人项目', en: 'Web development & personal projects' },
    { icon: 'ri-robot-2-line', zh: 'AI Agent 与 AI 辅助开发', en: 'AI agents & assistive dev workflows' },
    { icon: 'ri-server-line', zh: '网络、Linux 与服务器基础设施', en: 'Networks, Linux & server infra' },
    { icon: 'ri-gamepad-line', zh: 'Minecraft 服务器与社区运维', en: 'Minecraft server & community ops' },
    { icon: 'ri-cpu-line', zh: 'ESP32、嵌入式与物联网探索', en: 'ESP32, embedded systems & IoT' }
  ];

  const otherInterests = [
    { icon: 'ri-music-2-line', zh: '音乐与桌面音乐应用', en: 'Music & desktop audio apps' },
    { icon: 'ri-compass-3-line', zh: '技术实验、开源项目与新工具探索', en: 'Tech experiments, OSS & tool exploration' }
  ];

  // Currently exploring directions (max 3, linking to /lab)
  const explorations = [
    {
      index: '01',
      icon: 'ri-layout-masonry-line',
      titleZh: '个人技术门户',
      titleEn: 'Personal Tech Portal',
      tag: 'SvelteKit · Markdown',
      descZh: '基于 SvelteKit 的轻量个人门户与内容系统架构探索。',
      descEn: 'Lightweight personal portal and Markdown content architecture.'
    },
    {
      index: '02',
      icon: 'ri-brain-line',
      titleZh: 'AI Agent 协作',
      titleEn: 'AI Agent Workflows',
      tag: 'Tool-calling · Multi-agent',
      descZh: '探索大语言模型工具调用机制与多 Agent 自动化协作。',
      descEn: 'Tool-calling mechanisms, task delegation, and multi-agent workflows.'
    },
    {
      index: '03',
      icon: 'ri-cloud-wind-line',
      titleZh: '网络与边缘计算',
      titleEn: 'Networking & Edge',
      tag: 'Linux · HTTP · Edge',
      descZh: '探索 Linux 服务体系、TCP/UDP、HTTP 协议以及边缘托管。',
      descEn: 'Linux server internals, HTTP protocol behavior, and Edge deployment.'
    }
  ];
</script>

<svelte:head>
  <title>{i18n.t('page.about')} — Xiaozhe</title>
  <meta name="language" content={$i18n} />
</svelte:head>

<div class="about-page">
  <!-- Page header -->
  <header class="about-header">
    <div class="about-header-meta">
      <span class="eyebrow">{i18n.t('about.eyebrow')}</span>
      <span class="about-header-sep">/</span>
      <span class="about-header-tag">ARCHIVE & PROFILE</span>
    </div>
    <h1 class="about-title">{i18n.t('page.aboutTitle')}</h1>
  </header>

  <!-- Bento Grid Container -->
  <div class="about-grid">

    <!-- ① Main Profile Card (Col span 8 on desktop) -->
    <section class="about-card about-card-main">
      <div class="about-card-badge">PROFILE // 01</div>
      <div class="about-main-body">
        <ProgressiveImage
          class="about-main-avatar"
          src="/images/xiaozhe-avatar.jpg"
          alt="Xiaozhe Nice"
          width={88}
          height={88}
          priority
          spinnerSize={20}
        />
        <div class="about-main-info">
          <div class="about-main-heading">
            <h2 class="about-main-name">{i18n.t('about.name')}</h2>
            <span class="about-main-handle">@XiaozheQAQ</span>
          </div>
          <p class="about-main-tagline">{i18n.t('about.tagline')}</p>
          <p class="about-main-bio">{i18n.t('about.bio')}</p>
          <div class="about-main-footer">
            <a
              href="https://github.com/XiaozheQAQ"
              target="_blank"
              rel="noreferrer"
              class="about-inline-link"
            >
              <i class="ri-github-line"></i>
              <span>github.com/XiaozheQAQ</span>
              <i class="ri-arrow-right-up-line link-arrow"></i>
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- ② Age Card (Col span 2 on desktop) -->
    <div class="about-card about-card-age">
      <div class="about-stat-header">
        <span class="about-card-eyebrow">
          <i class="ri-calendar-line"></i>
          {i18n.t('about.ageLabel')}
        </span>
      </div>
      <div class="about-age-content">
        <span class="about-stat-number">{i18n.t('about.ageValue')}</span>
        <span class="about-stat-unit">{i18n.t('about.ageUnit')}</span>
      </div>
      <div class="about-card-footer-note">
        <span>2026 // ADULT</span>
      </div>
    </div>

    <!-- ③ Gender Card (Col span 2 on desktop) -->
    <div class="about-card about-card-gender">
      <div class="about-stat-header">
        <span class="about-card-eyebrow">
          <i class="ri-lock-line"></i>
          {i18n.t('about.genderLabel')}
        </span>
      </div>
      <div class="about-gender-content">
        <span class="about-gender-status">{i18n.t('about.genderValue')}</span>
      </div>
      <div class="about-card-footer-note">
        <span class="about-restrained-badge">UNDISCLOSED</span>
      </div>
    </div>

    <!-- ④ School Card (Col span 6 on desktop) -->
    <div class="about-card about-card-school">
      <div class="about-card-header">
        <span class="about-card-eyebrow">
          <i class="ri-school-line"></i>
          {i18n.t('about.schoolLabel')}
        </span>
        <span class="about-tag-badge">{i18n.t('about.schoolClass')}</span>
      </div>
      <div class="about-academic-main">
        <h3 class="about-academic-title">{i18n.t('about.schoolName')}</h3>
        <p class="about-academic-faculty">{i18n.t('about.schoolFaculty')}</p>
      </div>
    </div>

    <!-- ⑤ Major Card (Col span 6 on desktop) -->
    <div class="about-card about-card-major">
      <div class="about-card-header">
        <span class="about-card-eyebrow">
          <i class="ri-graduation-cap-line"></i>
          {i18n.t('about.majorLabel')}
        </span>
        <span class="about-tag-badge">{i18n.t('about.majorClass')}</span>
      </div>
      <div class="about-academic-main">
        <h3 class="about-academic-title">{i18n.t('about.majorName')}</h3>
        <p class="about-academic-faculty">{i18n.t('about.majorStatus')}</p>
      </div>
    </div>

    <!-- ⑥ Tech Stack Card (Col span 5 on desktop) -->
    <section class="about-card about-card-stack">
      <div class="about-card-header">
        <span class="about-card-eyebrow">
          <i class="ri-code-s-slash-line"></i>
          {i18n.t('about.stackLabel')}
        </span>
      </div>

      <div class="about-stack-groups">
        <div class="about-stack-group">
          <span class="about-stack-label">{i18n.t('about.stackLang')}</span>
          <div class="about-stack-tags">
            {#each stackLanguages as item}
              <span class="about-tech-tag" class:active={item.active}>{item.name}</span>
            {/each}
          </div>
        </div>

        <div class="about-stack-group">
          <span class="about-stack-label">{i18n.t('about.stackWeb')}</span>
          <div class="about-stack-tags">
            {#each stackWeb as item}
              <span class="about-tech-tag" class:active={item.active}>{item.name}</span>
            {/each}
          </div>
        </div>

        <div class="about-stack-group">
          <span class="about-stack-label">{i18n.t('about.stackSys')}</span>
          <div class="about-stack-tags">
            {#each stackTools as item}
              <span class="about-tech-tag" class:active={item.active}>{item.name}</span>
            {/each}
          </div>
        </div>
      </div>

      <div class="about-stack-footer">
        <span class="about-footnote-text">{i18n.t('about.stackNote')}</span>
      </div>
    </section>

    <!-- ⑦ Interests Card (Col span 7 on desktop) -->
    <section class="about-card about-card-interests">
      <div class="about-card-header">
        <span class="about-card-eyebrow">
          <i class="ri-heart-3-line"></i>
          {i18n.t('about.interestsLabel')}
        </span>
      </div>

      <div class="about-interests-body">
        <div class="about-interests-subgroup">
          <span class="about-interests-category">{i18n.t('about.interestTech')}</span>
          <ul class="about-interest-list">
            {#each techInterests as item}
              <li class="about-interest-row">
                <i class="{item.icon} about-interest-icon"></i>
                <span class="about-interest-text">{$i18n === 'zh-CN' ? item.zh : item.en}</span>
              </li>
            {/each}
          </ul>
        </div>

        <div class="about-interests-subgroup">
          <span class="about-interests-category">{i18n.t('about.interestOther')}</span>
          <ul class="about-interest-list">
            {#each otherInterests as item}
              <li class="about-interest-row">
                <i class="{item.icon} about-interest-icon"></i>
                <span class="about-interest-text">{$i18n === 'zh-CN' ? item.zh : item.en}</span>
              </li>
            {/each}
          </ul>
        </div>
      </div>
    </section>

    <!-- ⑧ Currently Exploring (Col span 12 on desktop) -->
    <section class="about-card about-card-exploring">
      <div class="about-card-header">
        <div>
          <span class="about-card-eyebrow">
            <i class="ri-flask-line"></i>
            {i18n.t('about.exploringLabel')}
          </span>
          <span class="about-exploring-sub">{i18n.t('about.exploringSubtitle')}</span>
        </div>
        <a href="/lab" class="about-lab-action">
          <span>{i18n.t('about.viewLab')}</span>
          <i class="ri-arrow-right-line"></i>
        </a>
      </div>

      <div class="about-exploring-grid">
        {#each explorations as item}
          <a href="/lab" class="about-exploring-item">
            <div class="about-exploring-item-top">
              <span class="about-exploring-idx">{item.index}</span>
              <span class="about-exploring-tag">{item.tag}</span>
            </div>
            <div class="about-exploring-item-title">
              <i class="{item.icon} about-exploring-icon"></i>
              <h4>{$i18n === 'zh-CN' ? item.titleZh : item.titleEn}</h4>
            </div>
            <p class="about-exploring-desc">{$i18n === 'zh-CN' ? item.descZh : item.descEn}</p>
          </a>
        {/each}
      </div>
    </section>

    <!-- ⑨ GitHub Entry Banner (Col span 12 on desktop) -->
    <a
      href="https://github.com/XiaozheQAQ"
      target="_blank"
      rel="noreferrer"
      class="about-card about-card-github"
    >
      <div class="about-github-icon-wrap">
        <i class="ri-github-fill"></i>
      </div>
      <div class="about-github-content">
        <div class="about-github-header-row">
          <span class="about-card-eyebrow">{i18n.t('about.githubLabel')}</span>
          <span class="about-github-online-dot"></span>
        </div>
        <h3 class="about-github-title">{i18n.t('about.githubTitle')}</h3>
        <p class="about-github-desc">{i18n.t('about.githubDesc')}</p>
      </div>
      <div class="about-github-action">
        <span class="about-github-btn">
          <span>GitHub</span>
          <i class="ri-arrow-right-up-line"></i>
        </span>
      </div>
    </a>

  </div>
</div>
