<script>
	import ColorWinRateChart from '$lib/ColorWinRateChart.svelte';
	import EloHistoryChart from '$lib/EloHistoryChart.svelte';

	/** @type {{ eloHistory?: import('$lib/elo-history.js').EloHistoryPoint[], colorStats?: { white: import('$lib/player-stats.js').ColorRecord, black: import('$lib/player-stats.js').ColorRecord } }} */
	let { eloHistory = [], colorStats } = $props();

	let activeChart = $state(/** @type {'rating' | 'color'} */ ('rating'));

	/** @param {'rating' | 'color'} tab */
	const setChart = (tab) => {
		activeChart = tab;
	};
</script>

<section class="stats-charts-card">
	<div class="chart-tabs" role="tablist" aria-label="Player statistics charts">
		<button
			type="button"
			role="tab"
			class:active={activeChart === 'rating'}
			aria-selected={activeChart === 'rating'}
			onclick={() => setChart('rating')}
		>
			Rating over time
		</button>
		<button
			type="button"
			role="tab"
			class:active={activeChart === 'color'}
			aria-selected={activeChart === 'color'}
			onclick={() => setChart('color')}
		>
			Win rate by color
		</button>
	</div>

	<div class="chart-panel" role="tabpanel">
		{#if activeChart === 'rating'}
			<EloHistoryChart points={eloHistory} />
		{:else if colorStats}
			<ColorWinRateChart stats={colorStats} />
		{/if}
	</div>
</section>

<style>
	.stats-charts-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 14px;
		padding: 1.25rem;
	}

	.chart-tabs {
		display: flex;
		gap: 0.25rem;
		border-bottom: 1px solid var(--color-border);
		margin-bottom: 1rem;
	}

	.chart-tabs button {
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		margin-bottom: -1px;
		padding: 6px 12px;
		font-size: 0.85rem;
		color: var(--color-tab-inactive);
		cursor: pointer;
		transition: color 0.15s, border-color 0.15s;
		font-family: inherit;
		white-space: nowrap;
	}

	.chart-tabs button:hover {
		color: var(--color-tab-hover);
	}

	.chart-tabs button.active {
		color: var(--color-tab-active);
		border-bottom-color: var(--color-tab-active);
	}

	.chart-panel {
		min-height: 140px;
	}

	@media (max-width: 480px) {
		.chart-tabs {
			overflow-x: auto;
		}

		.chart-tabs button {
			font-size: 0.8rem;
			padding: 6px 10px;
		}
	}
</style>
