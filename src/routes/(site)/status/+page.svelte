<script lang="ts">
  import { onMount } from 'svelte';
  import { useI18n } from '#lib/i18n';
  import { courses, statusServices, getScheduleDetails, semesterInfo, type RoomGuide } from '#lib/status/schedule';
  import MaimaiArchive from '#lib/features/maimai/MaimaiArchive.svelte';

  type CheckState = 'checking' | 'healthy' | 'unhealthy' | 'unconfigured';
  type Check = { state: CheckState; responseTime?: number; checkedAt?: Date };

  const i18n = useI18n();
  const locale = i18n.locale;
  const timezone = semesterInfo.timezone;
  let now = $state<Date | null>(null);
  let refreshing = $state(false);
  let checks = $state<Record<string, Check>>({});

  const statusLabels: Record<CheckState, string> = {
    checking: 'status.checking',
    healthy: 'status.healthy',
    unhealthy: 'status.unhealthy',
    unconfigured: 'status.unconfigured'
  };

  function formatDate(date: Date) {
    return new Intl.DateTimeFormat($locale === 'zh-CN' ? 'zh-CN' : 'en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    }).format(date);
  }

  function formatTime(date: Date) {
    return new Intl.DateTimeFormat($locale === 'zh-CN' ? 'zh-CN' : 'en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      hourCycle: 'h23'
    }).format(date);
  }

  function setChecking() {
    checks = Object.fromEntries(statusServices.map((service) => [service.key, { state: 'checking' }]));
  }

  async function refreshChecks() {
    if (refreshing) return;
    refreshing = true;
    setChecking();
    const results = await Promise.all(
      statusServices.map(async (service) => {
        const startedAt = performance.now();
        try {
          const response = await fetch(service.path, { cache: 'no-store' });
          return [
            service.key,
            {
              state: response.ok ? 'healthy' : 'unhealthy',
              responseTime: Math.round(performance.now() - startedAt),
              checkedAt: new Date()
            }
          ] as const;
        } catch {
          return [
            service.key,
            {
              state: 'unhealthy',
              responseTime: Math.round(performance.now() - startedAt),
              checkedAt: new Date()
            }
          ] as const;
        }
      })
    );
    checks = Object.fromEntries(results);
    refreshing = false;
  }

  function checkLabel(state: CheckState) {
    return i18n.t(statusLabels[state]);
  }

  function roomAccessLabel(guide: RoomGuide) {
    const base =
      guide.access === 'elevator'
        ? i18n.t('status.elevator.yes')
        : guide.access === 'stairs'
          ? i18n.t('status.elevator.no')
          : i18n.t('status.elevator.ground');
    if (!guide.side) return base;
    return base + ' · ' + i18n.t(guide.side === 'left' ? 'status.side.left' : 'status.side.right');
  }

  onMount(() => {
    now = new Date();
    const clock = window.setInterval(() => (now = new Date()), 1000);
    const interval = window.setInterval(() => {
      if (!document.hidden) refreshChecks();
    }, 60_000);
    const handleVisibility = () => {
      if (!document.hidden) refreshChecks();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    refreshChecks();
    return () => {
      window.clearInterval(clock);
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  });

  let schedule = $derived(now ? getScheduleDetails(now) : null);
</script>

<svelte:head>
  <title>{i18n.t('page.status')} — Xiaozhe</title>
  <meta name="description" content={i18n.t('page.statusDescription')} />
  <meta name="language" content={$i18n} />
</svelte:head>

<div class="status-page" data-locale={$locale}>
  <section class="pb-2 pt-5 lg:pt-7">
    <p class="eyebrow">{i18n.t('page.statusEyebrow')}</p>
    <h1 class="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">{i18n.t('page.status')}</h1>
    <p class="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">{i18n.t('page.statusDescription')}</p>
  </section>

  <section class="status-section">
    <div class="status-section-heading">
      <div>
        <p class="eyebrow"><i class="ri-user-3-line" aria-hidden="true"></i> {i18n.t('status.personal')}</p>
        <p class="status-section-description">{i18n.t('status.personalDescription')}</p>
      </div>
    </div>
    <div class="status-card-grid personal-status-grid">
      <article class="status-card">
        <div class="status-card-icon"><i class="ri-time-line" aria-hidden="true"></i></div>
        <div class="status-card-main">
          <div class="status-card-title-row">
            <h2>{i18n.t('status.currentTime')}</h2>
            {#if schedule?.week}
              <span class="schedule-week-badge">
                {i18n.t('status.weekBadge').replace('{week}', String(schedule.week))}
              </span>
            {/if}
          </div>
          {#if now}
            <time class="status-clock" datetime={now.toISOString()}>{formatTime(now)}</time>
            <p class="status-card-meta">{formatDate(now)} · {timezone}</p>
          {:else}
            <p class="status-empty">{i18n.t('status.checking')}</p>
          {/if}
        </div>
      </article>

      <article class="status-card">
        <div class="status-card-icon"><i class="ri-calendar-schedule-line" aria-hidden="true"></i></div>
        <div class="status-card-main">
          <div class="status-card-title-row">
            <h2>{i18n.t('status.schedule')}</h2>
            {#if schedule?.currentCourse}
              <span class="schedule-status-badge status-badge-live">{i18n.t('status.inSession')}</span>
            {:else if schedule?.breakCourse}
              <span class="schedule-status-badge status-badge-break">{i18n.t('status.inBreak')}</span>
            {:else if schedule?.nextCourse && schedule.minutesUntilNext !== null}
              <span class="schedule-status-badge status-badge-next">
                {i18n.t('status.countdown').replace('{minutes}', String(schedule.minutesUntilNext))}
              </span>
            {/if}
          </div>

          {#if !courses.length}
            <p class="status-empty">{i18n.t('status.scheduleEmpty')}</p>
            <p class="status-card-meta">{i18n.t('status.scheduleEmptyHint')}</p>
          {:else if schedule?.currentCourse}
            <p class="status-clock">{schedule.currentCourse.name}</p>
            <p class="status-card-meta">
              {schedule.currentCourse.start}–{schedule.currentCourse.end}
              · {schedule.currentCourse.room || (schedule.currentCourse.isOnline ? i18n.t('status.online') : i18n.t('status.locationTbd'))}
              {#if schedule.currentCourse.teacher}· {schedule.currentCourse.teacher}{/if}
            </p>
          {:else if schedule?.breakCourse}
            <p class="status-clock">{schedule.breakCourse.name}</p>
            <p class="status-card-meta">
              {schedule.breakCourse.start}–{schedule.breakCourse.end}
              · {schedule.breakCourse.room || (schedule.breakCourse.isOnline ? i18n.t('status.online') : i18n.t('status.locationTbd'))}
            </p>
          {:else if schedule?.nextCourse}
            <p class="status-clock">{schedule.nextCourse.name}</p>
            <p class="status-card-meta">
              {i18n.t('status.nextClass')} · {schedule.nextCourse.start}
              · {schedule.nextCourse.room || (schedule.nextCourse.isOnline ? i18n.t('status.online') : i18n.t('status.locationTbd'))}
            </p>
          {:else if schedule?.isHoliday}
            <p class="status-empty">{i18n.t('status.holiday')}</p>
            <p class="status-card-meta">{semesterInfo.school} · {semesterInfo.class}</p>
          {:else if schedule && schedule.todaysCourses.length > 0}
            <p class="status-empty">{i18n.t('status.classesFinished')}</p>
            <p class="status-card-meta">{schedule.todaysCourses.length} {i18n.t('status.todaysClasses')}</p>
          {:else}
            <p class="status-empty">{i18n.t('status.noClassToday')}</p>
            <p class="status-card-meta">{semesterInfo.school} · {semesterInfo.class}</p>
          {/if}
        </div>
      </article>
    </div>

    {#if schedule && schedule.todaysCourses.length > 0}
      <div class="schedule-agenda-block">
        <h3 class="schedule-block-title">
          <i class="ri-list-check-2" aria-hidden="true"></i> {i18n.t('status.todaysClasses')}
        </h3>
        <div class="schedule-agenda-list">
          {#each schedule.todaysCourses as item}
            {@const inThisCourse = schedule.currentCourse?.id === item.id}
            <div class="schedule-agenda-item" class:is-active={inThisCourse}>
              <span class="schedule-agenda-time">{item.start}–{item.end}</span>
              <div class="schedule-agenda-info">
                <span class="schedule-agenda-name">{item.name}</span>
                <span class="schedule-agenda-meta">
                  {item.room || (item.isOnline ? i18n.t('status.online') : i18n.t('status.locationTbd'))}
                  {#if item.teacher}· {item.teacher}{/if}
                </span>
              </div>
              {#if inThisCourse}
                <span class="schedule-live-dot" title={i18n.t('status.inSession')}></span>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/if}

    {#if schedule && schedule.activePractices.length > 0}
      <div class="practice-block">
        <h3 class="schedule-block-title">
          <i class="ri-survey-line" aria-hidden="true"></i> {i18n.t('status.practiceTitle')}
        </h3>
        <div class="practice-grid">
          {#each schedule.activePractices as practice}
            <div class="practice-card">
              <div class="practice-card-header">
                <span class="practice-name">{practice.name}</span>
                <span class="practice-badge">{practice.weekRangeText}</span>
              </div>
              <p class="practice-dates">{practice.dateRange}</p>
              <dl class="practice-details">
                <div>
                  <dt>{i18n.t('status.teacher')}</dt>
                  <dd>{practice.teachers}</dd>
                </div>
                <div>
                  <dt>{i18n.t('status.room')}</dt>
                  <dd>{practice.location || i18n.t('status.locationTbd')}</dd>
                </div>
              </dl>
              <p class="practice-note"><i class="ri-time-line" aria-hidden="true"></i> {i18n.t('status.timeTbd')}</p>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    {#if schedule && schedule.todayRoomGuides.length > 0}
      <div class="practice-block room-guide-block">
        <h3 class="schedule-block-title">
          <i class="ri-route-line" aria-hidden="true"></i> {i18n.t('status.roomGuideTitle')}
        </h3>
        <p class="schedule-room-guide-desc">{i18n.t('status.roomGuideDescription')}</p>
        <div class="practice-grid">
          {#each schedule.todayRoomGuides as guide}
            <div class="practice-card">
              <div class="practice-card-header">
                <span class="practice-name">{guide.room}</span>
                <span class="practice-badge">{roomAccessLabel(guide)}</span>
              </div>
              <p class="room-guide-route">{guide.route}</p>
              {#if guide.note}
                <p class="practice-note"><i class="ri-bookmark-3-line" aria-hidden="true"></i> {guide.note}</p>
              {/if}
            </div>
          {/each}
        </div>
        {#if schedule.roomChangeNotice}
          <p class="room-change-notice">
            <i class="ri-walk-line" aria-hidden="true"></i>
            <span>
              <strong>{i18n.t('status.roomChangeTitle')}</strong>
              · {i18n.t('status.roomChangeText').replace('{fromRoom}', schedule.roomChangeNotice.fromRoom).replace('{toRoom}', schedule.roomChangeNotice.toRoom).replace('{fromEnd}', schedule.roomChangeNotice.fromEndTime).replace('{toStart}', schedule.roomChangeNotice.toStartTime).replace('{minutes}', String(schedule.roomChangeNotice.gapMinutes))}
            </span>
          </p>
        {/if}
      </div>
    {/if}

    <p class="schedule-footer-meta">
      <i class="ri-book-open-line" aria-hidden="true"></i> {i18n.t('status.academicMeta')} · {semesterInfo.class} · {i18n.t('status.creditNotice')}
    </p>
  </section>

  <section class="status-section maimai-section">
    <div class="status-section-heading">
      <p class="eyebrow"><i class="ri-gamepad-line" aria-hidden="true"></i> {i18n.t('maimai.section')}</p>
      <p class="status-section-description">{i18n.t('maimai.sectionDescription')}</p>
    </div>
    <MaimaiArchive />
  </section>

  <section class="status-section website-status-section">
    <div class="status-section-heading status-section-heading-row">
      <div>
        <p class="eyebrow"><i class="ri-pulse-line" aria-hidden="true"></i> {i18n.t('status.website')}</p>
        <p class="status-section-description">{i18n.t('status.websiteDescription')}</p>
      </div>
      <button class="status-refresh-button" type="button" onclick={refreshChecks} disabled={refreshing}>
        <i class:spin={refreshing} class="ri-refresh-line" aria-hidden="true"></i>
        {refreshing ? i18n.t('status.refreshing') : i18n.t('status.refresh')}
      </button>
    </div>
    <div class="status-card-grid">
      {#each statusServices as service}
        {@const check = checks[service.key] ?? { state: 'unconfigured' as CheckState }}
        <article class="status-card website-status-card">
          <div class={`status-indicator status-indicator-${check.state}`} aria-hidden="true"></div>
          <div class="status-card-main">
            <div class="status-card-title-row">
              <h2>{i18n.t(`status.service.${service.key}`)}</h2>
              <span class={`status-label status-label-${check.state}`}>{checkLabel(check.state)}</span>
            </div>
            <p class="status-card-meta">{service.path}</p>
            <dl class="status-check-details">
              <div><dt>{i18n.t('status.responseTime')}</dt><dd>{check.responseTime !== undefined ? `${check.responseTime} ms` : '—'}</dd></div>
              <div><dt>{i18n.t('status.lastChecked')}</dt><dd>{check.checkedAt ? formatTime(check.checkedAt) : '—'}</dd></div>
            </dl>
          </div>
        </article>
      {/each}
    </div>
    <p class="status-disclaimer"><i class="ri-information-line" aria-hidden="true"></i> {i18n.t('status.noMonitoring')}</p>
  </section>
</div>
