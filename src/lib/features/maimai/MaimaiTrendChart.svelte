<script lang="ts">
  import { useI18n } from '#lib/i18n';
  import type { MaimaiTrendPoint } from '#lib/maimai/types';
  import { formatNumber, shortDateLabel } from '#lib/maimai/format';

  /**
   * DX Rating history as a lightweight inline SVG — one chart does not justify a
   * charting dependency.
   *
   * Every point is a real entry from the API's RatingTrend list: nothing is
   * interpolated and no point is invented. The parent only mounts this
   * component when the history actually has data.
   */
  let { points }: { points: MaimaiTrendPoint[] } = $props();

  const i18n = useI18n();

  const WIDTH = 720;
  const HEIGHT = 240;
  const PADDING = { top: 20, right: 20, bottom: 34, left: 58 };

  const chart = $derived.by(() => {
    const totals = points.map((point) => point.total);
    const standard = points.map((point) => point.standard);
    const dx = points.map((point) => point.dx);
    const known = totals
      .concat(standard.filter((value): value is number => value !== null))
      .concat(dx.filter((value): value is number => value !== null));
    const min = Math.min(...known);
    const max = Math.max(...known);
    const span = Math.max(1, max - min);
    const low = min - span * 0.12;
    const high = max + span * 0.12;
    const innerWidth = WIDTH - PADDING.left - PADDING.right;
    const innerHeight = HEIGHT - PADDING.top - PADDING.bottom;
    const step = points.length > 1 ? innerWidth / (points.length - 1) : 0;
    const x = (index: number) => PADDING.left + (points.length > 1 ? index * step : innerWidth / 2);
    const y = (value: number) => PADDING.top + (1 - (value - low) / (high - low)) * innerHeight;
    const line = (values: (number | null)[]) =>
      values
        .map((value, index) => (value === null ? null : x(index) + ',' + y(value)))
        .filter((pair): pair is string => pair !== null)
        .join(' ');
    const hasFull = (values: (number | null)[]) => values.every((value) => value !== null) && values.length > 1;

    return {
      x,
      y,
      innerWidth,
      innerHeight,
      low,
      high,
      totalLine: line(totals),
      standardLine: hasFull(standard) ? line(standard) : '',
      dxLine: hasFull(dx) ? line(dx) : '',
      gridValues: [high, (high + low) / 2, low],
      labelIndexes: [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])],
      latest: points[points.length - 1],
      previous: points.length > 1 ? points[points.length - 2] : null,
      baseline: PADDING.top + innerHeight
    };
  });

  const delta = $derived(chart.previous ? chart.latest.total - chart.previous.total : null);
</script>

<figure class="maimai-trend">
  <figcaption class="maimai-trend-summary">
    <span class="maimai-trend-latest">
      <span class="maimai-stat-label">{i18n.t('maimai.trendLatest')}</span>
      <span class="maimai-trend-value">{formatNumber(chart.latest.total)}</span>
    </span>
    {#if delta !== null}
      <span class="maimai-trend-delta" data-direction={delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'}>
        <i
          class={delta > 0 ? 'ri-arrow-up-line' : delta < 0 ? 'ri-arrow-down-line' : 'ri-subtract-line'}
          aria-hidden="true"
        ></i>
        {delta > 0 ? '+' : ''}{formatNumber(delta)}
        <span class="maimai-trend-delta-label">{i18n.t('maimai.trendChange')}</span>
      </span>
    {/if}
    <span class="maimai-trend-points">{i18n.t('maimai.trendPoints').replace('{count}', String(points.length))}</span>
  </figcaption>

  <svg
    class="maimai-chart"
    viewBox={'0 0 ' + WIDTH + ' ' + HEIGHT}
    role="img"
    aria-label={i18n.t('maimai.trendTitle')}
  >
    {#each chart.gridValues as value}
      <line
        class="maimai-chart-grid"
        x1={PADDING.left}
        x2={PADDING.left + chart.innerWidth}
        y1={chart.y(value)}
        y2={chart.y(value)}
      />
      <text class="maimai-chart-axis" x={PADDING.left - 10} y={chart.y(value) + 4} text-anchor="end">
        {formatNumber(Math.round(value))}
      </text>
    {/each}

    {#if points.length > 1}
      <polygon
        class="maimai-chart-area"
        points={chart.totalLine +
          ' ' +
          chart.x(points.length - 1) +
          ',' +
          chart.baseline +
          ' ' +
          chart.x(0) +
          ',' +
          chart.baseline}
      />
    {/if}

    {#if chart.standardLine}
      <polyline class="maimai-chart-line maimai-chart-line-standard" points={chart.standardLine} />
    {/if}
    {#if chart.dxLine}
      <polyline class="maimai-chart-line maimai-chart-line-dx" points={chart.dxLine} />
    {/if}

    {#if points.length > 1}
      <polyline class="maimai-chart-line maimai-chart-line-total" points={chart.totalLine} />
    {/if}

    {#each points as point, index}
      <circle class="maimai-chart-dot" cx={chart.x(index)} cy={chart.y(point.total)} r="3.4">
        <title>{point.date} · {formatNumber(point.total)}</title>
      </circle>
    {/each}

    {#each chart.labelIndexes as index}
      <text
        class="maimai-chart-axis"
        x={chart.x(index)}
        y={HEIGHT - 12}
        text-anchor={index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle'}
      >
        {shortDateLabel(points[index].date)}
      </text>
    {/each}
  </svg>

  <p class="maimai-chart-legend">
    <span class="maimai-legend-item">
      <span class="maimai-legend-swatch maimai-legend-total"></span>{i18n.t('maimai.trendTotal')}
    </span>
    {#if chart.standardLine}
      <span class="maimai-legend-item">
        <span class="maimai-legend-swatch maimai-legend-standard"></span>{i18n.t('maimai.trendStandard')}
      </span>
    {/if}
    {#if chart.dxLine}
      <span class="maimai-legend-item">
        <span class="maimai-legend-swatch maimai-legend-dx"></span>{i18n.t('maimai.trendDx')}
      </span>
    {/if}
  </p>
</figure>
