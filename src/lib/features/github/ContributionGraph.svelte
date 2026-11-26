<script lang="ts">
	import { onMount } from 'svelte';
	import { useI18n } from '#lib/i18n';

	type Cell = { date: string; count: number; level: number };

	/** Weeks shown in the compact calendar; cells stretch to fill the card width. */
	const WEEKS = 22;
	const DAY_MS = 86_400_000;

	const i18n = useI18n();

	let cells = $state<Cell[]>([]);
	let total = $state(0);
	let status = $state<'loading' | 'ready' | 'error'>('loading');
	let hovered = $state<Cell | null>(null);

	const fmt = (d: Date) => d.toISOString().slice(0, 10);

	/** Align the trailing weeks onto a Sunday-first 7-row grid, like GitHub's graph. */
	function buildWeeks(list: Cell[]): (Cell | null)[][] {
		if (!list.length) return [];
		const map = new Map(list.map((c) => [c.date, c]));
		const last = new Date(list[list.length - 1].date + 'T00:00:00Z');
		const end = new Date(last);
		end.setUTCDate(end.getUTCDate() + (6 - end.getUTCDay())); // Saturday
		const start = new Date(end);
		start.setUTCDate(start.getUTCDate() - (WEEKS * 7 - 1));

		const weeks: (Cell | null)[][] = [];
		for (let w = 0; w < WEEKS; w += 1) {
			const week: (Cell | null)[] = [];
			for (let d = 0; d < 7; d += 1) {
				const cur = new Date(start.getTime() + (w * 7 + d) * DAY_MS);
				week.push(map.get(fmt(cur)) ?? null);
			}
			weeks.push(week);
		}
		return weeks;
	}

	const weeks = $derived(buildWeeks(cells));

	function readout(cell: Cell): string {
		return i18n
			.t('home.contributionTimes')
			.replace('{date}', cell.date)
			.replace('{count}', String(cell.count));
	}

	/** One delegated listener for the whole grid instead of two per cell. */
	function handleOver(event: MouseEvent) {
		const el = (event.target as HTMLElement | null)?.closest<HTMLElement>('.contribution-cell');
		if (!el || el.classList.contains('is-empty')) return;
		const date = el.dataset.date;
		if (!date) return;
		hovered = {
			date,
			count: Number(el.dataset.count ?? 0),
			level: Number(el.dataset.level ?? 0)
		};
	}

	onMount(async () => {
		try {
			const res = await fetch('/api/contributions', { headers: { accept: 'application/json' } });
			const data = await res.json();
			if (!data?.available || !Array.isArray(data.contributions)) throw new Error('unavailable');
			cells = data.contributions;
			total = data.total ?? 0;
			status = 'ready';
		} catch {
			status = 'error';
		}
	});
</script>

<aside class="contribution-panel" aria-label={i18n.t('home.contribution')}>
	<header class="contribution-head">
		<span class="contribution-title">
			<i class="ri-github-line" aria-hidden="true"></i>
			{i18n.t('home.contribution')}
		</span>
		{#if status === 'ready'}
			<span class="contribution-total">
				<strong>{total}</strong>
				<span>{i18n.t('home.contributionUnit')}</span>
			</span>
		{/if}
	</header>

	{#if status === 'ready'}
		<div class="contribution-body">
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<!-- svelte-ignore a11y_mouse_events_have_key_events -->
			<div
				class="contribution-grid"
				role="img"
				aria-label={i18n.t('home.contribution')}
				onmouseover={handleOver}
				onmouseleave={() => (hovered = null)}
			>
				{#each weeks as week, wi}
					<div class="contribution-week">
						{#each week as cell, di}
							{#if cell}
								<div
									class="contribution-cell"
									data-level={cell.level}
									data-date={cell.date}
									data-count={cell.count}
									style="--i:{wi * 7 + di}"
									title={readout(cell)}
									role="presentation"
								></div>
							{:else}
								<span class="contribution-cell is-empty" style="--i:{wi * 7 + di}"></span>
							{/if}
						{/each}
					</div>
				{/each}
			</div>
		</div>
		<footer class="contribution-foot">
			{#if hovered}
				<span class="contribution-readout">{readout(hovered)}</span>
			{:else}
				<span class="contribution-legend">
					<span>{i18n.t('home.contributionLess')}</span>
					<i data-level="0"></i><i data-level="1"></i><i data-level="2"></i><i data-level="3"></i><i data-level="4"></i>
					<span>{i18n.t('home.contributionMore')}</span>
				</span>
			{/if}
		</footer>
	{:else if status === 'loading'}
		<div class="contribution-skeleton" aria-hidden="true">
			<div class="contribution-grid is-ghost">
				{#each Array(WEEKS) as _w, wi}
					<div class="contribution-week">
						{#each Array(7) as _d, di}<span class="contribution-cell" data-level="0" style="--i:{wi * 7 + di}"></span>{/each}
					</div>
				{/each}
			</div>
			<p class="contribution-skeleton-text">{i18n.t('home.contributionLoading')}</p>
		</div>
	{:else}
		<div class="contribution-placeholder">{i18n.t('home.contributionUnavailable')}</div>
	{/if}
</aside>

<style>
	.contribution-panel {
		border: 1px solid var(--line);
		border-radius: 24px;
		background: var(--surface);
		padding: 22px;
		align-self: end;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.contribution-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}
	.contribution-title {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text);
	}
	.contribution-title i {
		color: var(--accent-ink);
		font-size: 1.1rem;
	}
	.contribution-total {
		color: var(--muted);
		font-size: 0.72rem;
		white-space: nowrap;
	}
	.contribution-total strong {
		color: var(--text);
		font-size: 1.15rem;
		font-weight: 700;
		margin-right: 3px;
		font-variant-numeric: tabular-nums;
	}
	.contribution-body {
		min-width: 0;
	}
	.contribution-grid {
		display: flex;
		gap: 3px;
		width: 100%;
	}
	.contribution-week {
		display: flex;
		flex-direction: column;
		gap: 3px;
		flex: 1 1 0;
		min-width: 0;
	}
	.contribution-cell {
		width: 100%;
		aspect-ratio: 1 / 1;
		border-radius: 2px;
		background: var(--line);
		transition:
			transform 0.12s ease,
			box-shadow 0.12s ease;
		animation: contributionCellIn 0.45s ease backwards;
		animation-delay: calc(var(--i, 0) * 3ms);
	}
	.contribution-cell[data-level='0'] {
		background: var(--line);
	}
	.contribution-cell[data-level='1'] {
		background: #9be9a8;
	}
	.contribution-cell[data-level='2'] {
		background: #40c463;
	}
	.contribution-cell[data-level='3'] {
		background: #30a14e;
	}
	.contribution-cell[data-level='4'] {
		background: #216e39;
	}
	.contribution-cell:hover {
		transform: scale(1.35);
		box-shadow: 0 0 0 1.5px var(--accent-ink);
		position: relative;
		z-index: 1;
	}
	.contribution-cell.is-empty {
		visibility: hidden;
	}
	.contribution-foot {
		min-height: 16px;
		display: flex;
		align-items: center;
		font-size: 0.72rem;
		color: var(--muted);
	}
	.contribution-readout {
		color: var(--text);
		font-variant-numeric: tabular-nums;
	}
	.contribution-legend {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		margin-left: auto;
	}
	.contribution-legend i {
		width: 10px;
		height: 10px;
		border-radius: 2px;
		display: inline-block;
		background: var(--line);
	}
	.contribution-legend i[data-level='1'] {
		background: #9be9a8;
	}
	.contribution-legend i[data-level='2'] {
		background: #40c463;
	}
	.contribution-legend i[data-level='3'] {
		background: #30a14e;
	}
	.contribution-legend i[data-level='4'] {
		background: #216e39;
	}
	.contribution-skeleton {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.contribution-grid.is-ghost .contribution-cell {
		animation: none;
		opacity: 0.45;
	}
	.contribution-skeleton-text {
		font-size: 0.76rem;
		color: var(--muted);
	}
	.contribution-placeholder {
		min-height: 92px;
		display: flex;
		align-items: center;
		color: var(--muted);
		font-size: 0.82rem;
	}
	@keyframes contributionCellIn {
		from {
			opacity: 0;
			transform: scale(0.6);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}
	:global(html.dark) .contribution-cell[data-level='0'] {
		background: #1b2330;
	}
	:global(html.dark) .contribution-cell[data-level='1'] {
		background: #0e4429;
	}
	:global(html.dark) .contribution-cell[data-level='2'] {
		background: #006d32;
	}
	:global(html.dark) .contribution-cell[data-level='3'] {
		background: #26a641;
	}
	:global(html.dark) .contribution-cell[data-level='4'] {
		background: #39d353;
	}
	:global(html.dark) .contribution-legend i[data-level='0'] {
		background: #1b2330;
	}
	:global(html.dark) .contribution-legend i[data-level='1'] {
		background: #0e4429;
	}
	:global(html.dark) .contribution-legend i[data-level='2'] {
		background: #006d32;
	}
	:global(html.dark) .contribution-legend i[data-level='3'] {
		background: #26a641;
	}
	:global(html.dark) .contribution-legend i[data-level='4'] {
		background: #39d353;
	}
	@media (prefers-reduced-motion: reduce) {
		.contribution-cell {
			animation: none;
			transition: none;
		}
	}
	@media (max-width: 760px) {
		.contribution-panel {
			padding: 18px;
			gap: 14px;
		}
	}
</style>
