<script>
	import { BLACK_ICON, WHITE_ICON } from '$lib/matches.js';
	import { colorWinRate, pieGradient } from '$lib/player-stats.js';

	/** @type {{ stats: { white: { wins: number, losses: number, draws: number }, black: { wins: number, losses: number, draws: number } } }} */
	let { stats } = $props();

	/** @param {import('$lib/player-stats.js').ColorRecord} record @param {string} icon @param {string} label */
	const side = (record, icon, label) => ({
		icon,
		label,
		record,
		total: record.wins + record.losses + record.draws,
		winRate: colorWinRate(record),
		gradient: pieGradient(record)
	});

	let sides = $derived([
		side(stats.white, WHITE_ICON, 'White'),
		side(stats.black, BLACK_ICON, 'Black')
	]);
</script>

<div class="color-win-rate">
	{#each sides as s}
		<div class="side">
			<div class="pie-wrap">
				<div class="pie" style="background: {s.gradient}" aria-hidden="true"></div>
				<div class="pie-center">
					<span class="pie-rate">{s.total > 0 ? `${s.winRate}%` : '—'}</span>
				</div>
			</div>
			<div class="side-label">{s.icon} {s.label}</div>
			{#if s.total > 0}
				<div class="breakdown">
					<span class="wins">{s.record.wins}W</span>
					<span class="losses">{s.record.losses}L</span>
					<span class="draws">{s.record.draws}D</span>
				</div>
			{:else}
				<div class="breakdown empty">No games</div>
			{/if}
		</div>
	{/each}
</div>

<div class="legend" aria-hidden="true">
	<span><span class="dot win"></span> Win</span>
	<span><span class="dot loss"></span> Loss</span>
	<span><span class="dot draw"></span> Draw</span>
</div>

<style>
	.color-win-rate {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
	}

	.side {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.pie-wrap {
		position: relative;
		width: 88px;
		height: 88px;
	}

	.pie {
		width: 100%;
		height: 100%;
		border-radius: 50%;
	}

	.pie-center {
		position: absolute;
		inset: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-pie-center);
		border-radius: 50%;
	}

	.pie-rate {
		font-size: 0.95rem;
		font-weight: 700;
		color: var(--color-text);
	}

	.side-label {
		font-size: 0.88rem;
		color: var(--color-text-soft);
		font-weight: 500;
	}

	.breakdown {
		display: flex;
		gap: 0.65rem;
		font-size: 0.78rem;
		color: var(--color-text-faint);
	}

	.breakdown.empty {
		color: var(--color-text-dim);
	}

	.wins { color: var(--color-success); }
	.losses { color: var(--color-error); }
	.draws { color: var(--color-text-subtle); }

	.legend {
		display: flex;
		justify-content: center;
		gap: 1rem;
		margin-top: 0.75rem;
		font-size: 0.72rem;
		color: var(--color-text-dim);
	}

	.dot {
		display: inline-block;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		margin-right: 4px;
		vertical-align: middle;
	}

	.dot.win { background: var(--color-success); }
	.dot.loss { background: var(--color-error); }
	.dot.draw { background: var(--color-text-faint); }

	@media (max-width: 480px) {
		.color-win-rate {
			grid-template-columns: 1fr;
			gap: 1.25rem;
		}

		.legend {
			flex-wrap: wrap;
			gap: 0.5rem 1rem;
		}
	}
</style>
