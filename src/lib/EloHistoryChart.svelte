<script>
	import { buildEloChartGeometry, formatChartDate, formatChartTooltipDate } from '$lib/elo-history.js';

	/** @type {{ points?: import('$lib/elo-history.js').EloHistoryPoint[] }} */
	let { points = [] } = $props();

	let chart = $derived(buildEloChartGeometry(points));
	/** @type {string | null} */
	let hoveredKey = $state(null);

	const formatDelta = (/** @type {number} */ delta) =>
		delta === 0 ? 'Start' : `${delta >= 0 ? '+' : ''}${delta}`;

	/** @param {{ playedAt: string, rating: number }} dot */
	const dotKey = (dot) => `${dot.playedAt}:${dot.rating}`;

	let hovered = $derived(
		hoveredKey && chart.dots
			? (chart.dots.find((d) => dotKey(d) === hoveredKey) ?? null)
			: null
	);

	/** @param {NonNullable<typeof hovered>} dot */
	const tooltipLayout = (dot) => {
		if (!chart || chart.empty) return null;

		const label = String(dot.rating);
		const sub = formatDelta(dot.delta);
		const date = formatChartTooltipDate(dot.playedAt);
		const width = Math.max(72, label.length * 8 + sub.length * 5 + 24);
		const height = 36;
		const above = dot.y > chart.height * 0.35;
		const x = Math.min(
			Math.max(dot.x, chart.pad.left + width / 2),
			chart.width - chart.pad.right - width / 2
		);
		const y = above ? dot.y - height - 10 : dot.y + 10;

		return { x, y, width, height, label, sub, date, above };
	};

	let tooltip = $derived(hovered ? tooltipLayout(hovered) : null);
</script>

<div class="elo-history-chart">
	{#if chart.empty}
		<p class="empty">No rated games yet — chart appears after the first approved match.</p>
	{:else}
		<svg
			class="chart"
			viewBox="0 0 {chart.width} {chart.height}"
			role="img"
			aria-label="Rating over time line chart"
		>
			{#each chart.gridYs ?? [] as y}
				<line x1={chart.pad.left} y1={y} x2={chart.width - chart.pad.right} y2={y} class="grid" />
			{/each}

			{#each chart.yLabels ?? [] as label}
				<text x={chart.pad.left - 8} y={label.y + 4} class="axis-label y-label" text-anchor="end">
					{label.label}
				</text>
			{/each}

			<polyline class="line" points={chart.line} fill="none" />

			{#each chart.dots ?? [] as dot (dotKey(dot))}
				<circle
					cx={dot.x}
					cy={dot.y}
					r={10}
					class="hit"
					role="button"
					tabindex="0"
					aria-label="{formatChartTooltipDate(dot.playedAt)}: {dot.rating} ({formatDelta(dot.delta)})"
					onmouseenter={() => (hoveredKey = dotKey(dot))}
					onmouseleave={() => (hoveredKey = null)}
					onfocus={() => (hoveredKey = dotKey(dot))}
					onblur={() => (hoveredKey = null)}
				/>
				<circle
					cx={dot.x}
					cy={dot.y}
					r={hoveredKey === dotKey(dot) ? 5.5 : dot.isStart ? 3 : 4}
					class="dot"
					class:start={dot.isStart}
					class:gain={!dot.isStart && dot.delta > 0}
					class:loss={!dot.isStart && dot.delta < 0}
					class:draw={!dot.isStart && dot.delta === 0}
					class:active={hoveredKey === dotKey(dot)}
					pointer-events="none"
				/>
			{/each}

			{#if tooltip}
				<g class="tooltip" pointer-events="none" transform="translate({tooltip.x - tooltip.width / 2}, {tooltip.y})">
					<rect width={tooltip.width} height={tooltip.height} rx="6" class="tooltip-box" />
					<text x={tooltip.width / 2} y="14" class="tooltip-rating" text-anchor="middle">
						{tooltip.label}
						{#if tooltip.sub !== 'Start'}
							<tspan class="tooltip-delta" dx="4">{tooltip.sub}</tspan>
						{/if}
					</text>
					<text x={tooltip.width / 2} y="28" class="tooltip-date" text-anchor="middle">
						{tooltip.date}
					</text>
				</g>
			{/if}

			<text x={chart.pad.left} y={chart.height - 10} class="axis-label x-label">
				{formatChartDate(chart.xStart)}
			</text>
			<text
				x={chart.width - chart.pad.right}
				y={chart.height - 10}
				class="axis-label x-label"
				text-anchor="end"
			>
				{formatChartDate(chart.xEnd)}
			</text>
		</svg>
	{/if}
</div>

<style>
	.elo-history-chart {
		width: 100%;
	}

	.chart {
		width: 100%;
		height: auto;
		display: block;
		overflow: visible;
	}

	.empty {
		margin: 0;
		padding: 1.25rem 0.5rem;
		text-align: center;
		font-size: 0.85rem;
		color: var(--color-text-faint);
	}

	.grid {
		stroke: var(--color-border);
		stroke-width: 1;
	}

	.line {
		stroke: var(--color-accent-gold);
		stroke-width: 2;
		stroke-linejoin: round;
		stroke-linecap: round;
	}

	.hit {
		fill: transparent;
		cursor: pointer;
	}

	.hit:focus-visible {
		outline: none;
	}

	.hit:focus-visible + .dot {
		stroke: var(--color-accent-gold);
		stroke-width: 2;
	}

	.dot {
		fill: var(--color-accent-gold);
		stroke: var(--color-surface);
		stroke-width: 1.5;
		transition: r 0.12s ease;
	}

	.dot.active {
		stroke: var(--color-accent-gold);
		stroke-width: 2;
	}

	.dot.start {
		fill: var(--color-text-faint);
	}

	.dot.gain {
		fill: var(--color-success);
	}

	.dot.loss {
		fill: var(--color-error);
	}

	.dot.draw {
		fill: var(--color-text-muted);
	}

	.tooltip-box {
		fill: var(--color-surface-raised);
		stroke: var(--color-border-strong);
		stroke-width: 1;
		filter: drop-shadow(0 4px 10px rgb(0 0 0 / 18%));
	}

	.tooltip-rating {
		fill: var(--color-heading);
		font-size: 12px;
		font-weight: 700;
		font-family: inherit;
	}

	.tooltip-delta {
		fill: var(--color-text-muted);
		font-size: 11px;
		font-weight: 600;
	}

	.tooltip-date {
		fill: var(--color-text-faint);
		font-size: 9px;
		font-family: inherit;
	}

	.axis-label {
		fill: var(--color-text-faint);
		font-size: 10px;
		font-family: inherit;
	}

	.y-label {
		font-size: 9px;
	}
</style>
