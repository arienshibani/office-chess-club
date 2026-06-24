<script>
	import { evalAriaLabel, evalToWhitePercent, formatEvalLabel } from '$lib/stockfish/eval-display.js';

	/** @type {{ eval?: { cp?: number, mate?: number } | null, loading?: boolean }} */
	let { eval: evalPoint = null, loading = false } = $props();

	let whitePercent = $derived(evalToWhitePercent(evalPoint));
	let label = $derived(formatEvalLabel(evalPoint));
	let ariaLabel = $derived(evalAriaLabel(evalPoint));
</script>

<div class="eval-wrap">
	<span class="eval-label" class:muted={loading && !label} aria-hidden="true">
		{label || (loading ? '…' : '\u00a0')}
	</span>

	<div
		class="eval-bar"
		class:loading
		role="meter"
		aria-label={ariaLabel}
		aria-valuemin={0}
		aria-valuemax={100}
		aria-valuenow={Math.round(whitePercent)}
	>
		<div class="eval-bar-track">
			<div class="eval-bar-white" style="height: {whitePercent}%"></div>
		</div>
	</div>
</div>

<style>
	.eval-wrap {
		flex-shrink: 0;
		width: 2.75rem;
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 0.35rem;
		min-height: min(480px, 100vw);
		max-height: min(480px, 100vw);
	}

	.eval-label {
		display: block;
		flex-shrink: 0;
		width: 100%;
		min-height: 0.85rem;
		font-size: 0.72rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: var(--color-text-muted);
		line-height: 1;
		text-align: center;
		white-space: nowrap;
		overflow: hidden;
	}

	.eval-label.muted {
		color: var(--color-text-faint);
	}

	.eval-bar {
		flex: 1;
		width: 18px;
		min-height: 0;
		display: flex;
		flex-direction: column;
	}

	.eval-bar-track {
		flex: 1;
		width: 100%;
		min-height: 0;
		border-radius: 4px;
		overflow: hidden;
		border: 1px solid var(--color-border-strong);
		background: #1a1a1a;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
	}

	.eval-bar-white {
		width: 100%;
		background: #f0d9b5;
		transition: height 0.15s ease-out;
		min-height: 2px;
	}

	.eval-bar.loading .eval-bar-white {
		opacity: 0.5;
		animation: eval-pulse 1.2s ease-in-out infinite;
	}

	@keyframes eval-pulse {
		0%,
		100% {
			opacity: 0.45;
		}
		50% {
			opacity: 0.85;
		}
	}
</style>
