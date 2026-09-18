<script>
	import PieceColor from '$lib/components/player/PieceColor.svelte';
	import {
		buildEvalChartGeometry,
		formatEvalChartHover,
		nearestEvalChartIndex,
	} from '$lib/stockfish/eval-chart.js';

	/**
	 * @type {{
	 *   evals?: ({ cp?: number, mate?: number } | null)[],
	 *   activeIndex?: number,
	 *   whiteName?: string,
	 *   blackName?: string,
	 *   onSelectIndex?: (index: number) => void,
	 * }}
	 */
	let {
		evals = [],
		activeIndex = 0,
		whiteName = 'White',
		blackName = 'Black',
		onSelectIndex,
	} = $props();

	let chart = $derived(buildEvalChartGeometry(evals, { activeIndex }));
	let hoveredIndex = $state(/** @type {number | null} */ (null));
	let svgEl = $state(/** @type {SVGSVGElement | null} */ (null));

	let hoveredPoint = $derived(
		hoveredIndex != null ? (chart.points.find((p) => p.index === hoveredIndex) ?? null) : null,
	);

	let hoverLabel = $derived(
		hoveredPoint ? formatEvalChartHover(hoveredPoint.eval, hoveredPoint.index) : null,
	);

	/** @param {MouseEvent} event */
	const clientToSvgX = (event) => {
		if (!svgEl) return null;
		const rect = svgEl.getBoundingClientRect();
		if (rect.width <= 0) return null;
		return ((event.clientX - rect.left) / rect.width) * chart.width;
	};

	/** @param {MouseEvent} event */
	const onMove = (event) => {
		const x = clientToSvgX(event);
		if (x == null) return;
		hoveredIndex = nearestEvalChartIndex(chart, x);
	};

	const onLeave = () => {
		hoveredIndex = null;
	};

	/** @param {MouseEvent} event */
	const onClick = (event) => {
		const x = clientToSvgX(event);
		if (x == null) return;
		const index = nearestEvalChartIndex(chart, x);
		if (index != null) onSelectIndex?.(index);
	};

	/** @param {KeyboardEvent} event */
	const onKeyDown = (event) => {
		if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
		event.preventDefault();
		const current = activeIndex ?? 0;
		const next =
			event.key === 'ArrowLeft'
				? Math.max(0, current - 1)
				: Math.min(Math.max(0, evals.length - 1), current + 1);
		onSelectIndex?.(next);
	};
</script>

{#if !chart.empty}
	<div class="eval-chart">
		<div class="chart-row">
			<div class="y-axis">
				<span class="y-axis-row" title="White advantage">
					<span class="y-axis-name">{whiteName}</span>
					<PieceColor color="white" size={11} />
				</span>
				<span class="y-axis-row" title="Black advantage">
					<span class="y-axis-name">{blackName}</span>
					<PieceColor color="black" size={11} />
				</span>
			</div>
			<svg
				bind:this={svgEl}
				class="chart"
				viewBox="0 0 {chart.width} {chart.height}"
				role="img"
				aria-label="Engine advantage over the game. Top is {whiteName}'s advantage, bottom is {blackName}'s. Click to jump to a move."
				tabindex="0"
				onmousemove={onMove}
				onmouseleave={onLeave}
				onclick={onClick}
				onkeydown={onKeyDown}
			>
				<title>Advantage chart</title>

				<defs>
					<clipPath id="eval-chart-above">
						<rect
							x={chart.plotLeft}
							y={chart.plotTop}
							width={chart.plotRight - chart.plotLeft}
							height={chart.midY - chart.plotTop}
						/>
					</clipPath>
					<clipPath id="eval-chart-below">
						<rect
							x={chart.plotLeft}
							y={chart.midY}
							width={chart.plotRight - chart.plotLeft}
							height={chart.plotBottom - chart.midY}
						/>
					</clipPath>
				</defs>

				<rect
					class="zone-white"
					x={chart.plotLeft}
					y={chart.plotTop}
					width={chart.plotRight - chart.plotLeft}
					height={chart.midY - chart.plotTop}
				/>
				<rect
					class="zone-black"
					x={chart.plotLeft}
					y={chart.midY}
					width={chart.plotRight - chart.plotLeft}
					height={chart.plotBottom - chart.midY}
				/>

				<path class="area area-white" d={chart.areaPath} clip-path="url(#eval-chart-above)" />
				<path class="area area-black" d={chart.areaPath} clip-path="url(#eval-chart-below)" />

				<line
					class="midline"
					x1={chart.plotLeft}
					y1={chart.midY}
					x2={chart.plotRight}
					y2={chart.midY}
				/>

				<path class="line" d={chart.linePath} fill="none" />

				{#if chart.cursorX != null}
					<line
						class="cursor"
						x1={chart.cursorX}
						y1={chart.plotTop}
						x2={chart.cursorX}
						y2={chart.plotBottom}
					/>
				{/if}

				{#if hoveredPoint}
					<circle class="hover-dot" cx={hoveredPoint.x} cy={hoveredPoint.y} r="3.5" />
				{/if}

				{#each chart.xLabels as label}
					<text class="x-label" x={label.x} y={chart.height - 4} text-anchor="middle">
						{label.label}
					</text>
				{/each}
			</svg>
		</div>

		{#if hoverLabel && hoveredPoint}
			<div class="tooltip" style="left: {(hoveredPoint.x / chart.width) * 100}%">
				<span class="tooltip-title">{hoverLabel.title}</span>
				<span class="tooltip-eval">{hoverLabel.evalLabel}</span>
			</div>
		{/if}
	</div>
{/if}

<style>
	.eval-chart {
		position: relative;
		width: 100%;
		max-width: min(480px, 100%);
		margin-top: 0.35rem;
	}

	.chart-row {
		display: flex;
		align-items: stretch;
		gap: 0.35rem;
	}

	.y-axis {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding: 6px 0 16px;
		flex-shrink: 0;
		max-width: 7.5rem;
	}

	.y-axis-row {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.3rem;
		min-width: 0;
		line-height: 1.1;
	}

	.y-axis-name {
		font-size: 0.68rem;
		font-weight: 600;
		color: var(--color-text-subtle);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		min-width: 0;
	}

	.chart {
		display: block;
		flex: 1;
		min-width: 0;
		height: auto;
		border: 1px solid var(--color-border);
		border-radius: 8px;
		background: var(--color-surface);
		cursor: crosshair;
		outline: none;
	}

	.chart:focus-visible {
		border-color: var(--color-border-focus);
	}

	.zone-white {
		fill: var(--color-eval-chart-zone-white);
	}

	.zone-black {
		fill: var(--color-eval-chart-zone-black);
	}

	.area-white {
		fill: var(--color-eval-chart-fill-white);
	}

	.area-black {
		fill: var(--color-eval-chart-fill-black);
	}

	.midline {
		stroke: var(--color-border-strong);
		stroke-width: 1;
		stroke-dasharray: 3 3;
		opacity: 0.85;
	}

	.line {
		stroke: var(--color-eval-chart-line);
		stroke-width: 1.5;
		stroke-linejoin: round;
		stroke-linecap: round;
	}

	.cursor {
		stroke: var(--color-accent-gold);
		stroke-width: 1.5;
		opacity: 0.9;
	}

	.hover-dot {
		fill: var(--color-eval-chart-line);
		stroke: var(--color-surface);
		stroke-width: 1.5;
	}

	.x-label {
		fill: var(--color-text-dim);
		font-size: 9px;
	}

	.tooltip {
		position: absolute;
		top: 6px;
		transform: translateX(-50%);
		pointer-events: none;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1px;
		padding: 4px 8px;
		border-radius: 6px;
		background: var(--color-surface-raised);
		border: 1px solid var(--color-border-strong);
		box-shadow: none;
		white-space: nowrap;
		z-index: 2;
	}

	.tooltip-title {
		font-size: 0.68rem;
		color: var(--color-text-subtle);
	}

	.tooltip-eval {
		font-size: 0.78rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: var(--color-heading);
	}
</style>
