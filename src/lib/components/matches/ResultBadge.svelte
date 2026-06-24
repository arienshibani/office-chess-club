<script>
	import { AlertTriangle, Check, Minus, X } from '@lucide/svelte';

	/** @type {{ variant: 'pending' | 'win' | 'loss' | 'draw', label?: string, class?: string }} */
	let { variant, label, class: className = '' } = $props();

	const labels = {
		pending: 'Pending',
		win: 'Win',
		loss: 'Loss',
		draw: 'Draw'
	};

	const icons = {
		pending: AlertTriangle,
		win: Check,
		loss: X,
		draw: Minus
	};

	const Icon = $derived(icons[variant]);
	const text = $derived(label ?? labels[variant]);
</script>

<span class="badge {variant}-badge {className}">
	<Icon size={12} strokeWidth={2.25} aria-hidden="true" />
	{text}
</span>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: 0.72rem;
		font-weight: 600;
		border-radius: 4px;
		padding: 2px 6px;
		vertical-align: middle;
		white-space: nowrap;
	}

	.pending-badge {
		color: var(--color-warning);
		background: var(--color-badge-pending-bg);
		border: 1px solid var(--color-badge-pending-border);
	}

	.win-badge {
		color: var(--color-success);
		background: var(--color-badge-win-bg, transparent);
		border: 1px solid var(--color-badge-win-border, transparent);
	}

	.loss-badge {
		color: var(--color-error);
		background: var(--color-badge-loss-bg, transparent);
		border: 1px solid var(--color-badge-loss-border, transparent);
	}

	.draw-badge {
		color: var(--color-text-muted);
		background: var(--color-surface-muted);
		border: 1px solid var(--color-border);
	}
</style>
