<script>
	import { AlertCircle, ChevronDown } from '@lucide/svelte';

	let {
		message,
		details = '',
		stack = '',
		title = '',
		compact = false,
	} = $props();

	const hasDetails = $derived(Boolean(details || stack));
</script>

<div class="error-alert" class:compact role="alert" aria-live="polite">
	<div class="error-alert-head">
		<AlertCircle size={compact ? 16 : 18} class="error-icon" aria-hidden="true" />
		<div class="error-alert-body">
			{#if title}
				<p class="error-title">{title}</p>
			{/if}
			<p class="error-message">{message}</p>
		</div>
	</div>

	{#if hasDetails}
		<details class="error-details">
			<summary>
				<ChevronDown size={14} class="chevron" aria-hidden="true" />
				Technical details
			</summary>
			<div class="error-details-body">
				{#if details}
					<pre class="error-log">{details}</pre>
				{/if}
				{#if stack}
					<pre class="error-stack">{stack}</pre>
				{/if}
			</div>
		</details>
	{/if}
</div>

<style>
	.error-alert {
		background: var(--color-error-bg);
		border: 1px solid var(--color-error-border);
		border-radius: 10px;
		overflow: hidden;
		margin: 0 0 1rem;
	}

	.error-alert.compact {
		border-radius: 8px;
		margin: 0 0 0.85rem;
	}

	.error-alert-head {
		display: flex;
		align-items: flex-start;
		gap: 0.65rem;
		padding: 0.8rem 0.9rem;
	}

	.compact .error-alert-head {
		padding: 0.65rem 0.85rem;
	}

	.error-alert :global(.error-icon) {
		flex-shrink: 0;
		color: var(--color-error);
		margin-top: 0.1rem;
	}

	.error-alert-body {
		min-width: 0;
		flex: 1;
	}

	.error-title {
		margin: 0 0 0.2rem;
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.03em;
		text-transform: uppercase;
		color: var(--color-error);
	}

	.error-message {
		margin: 0;
		font-size: 0.86rem;
		line-height: 1.45;
		color: var(--color-error-soft);
	}

	.compact .error-message {
		font-size: 0.84rem;
	}

	.error-details {
		border-top: 1px solid var(--color-error-border);
		background: color-mix(in srgb, var(--color-error-bg) 70%, var(--color-bg));
	}

	.error-details summary {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.55rem 0.9rem;
		font-size: 0.76rem;
		font-weight: 600;
		color: var(--color-text-subtle);
		cursor: pointer;
		user-select: none;
		list-style: none;
	}

	.error-details summary::-webkit-details-marker {
		display: none;
	}

	.error-details summary:hover {
		color: var(--color-text-muted);
	}

	.error-details :global(.chevron) {
		transition: transform 0.15s ease;
	}

	.error-details[open] summary :global(.chevron) {
		transform: rotate(180deg);
	}

	.error-details-body {
		padding: 0 0.9rem 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.error-log,
	.error-stack {
		margin: 0;
		padding: 0.65rem 0.75rem;
		border-radius: 6px;
		background: var(--color-surface-muted);
		border: 1px solid var(--color-border);
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
		font-size: 0.72rem;
		line-height: 1.5;
		color: var(--color-text-code);
		white-space: pre-wrap;
		word-break: break-word;
		overflow-x: auto;
	}

	.error-stack {
		color: var(--color-text-faint);
		max-height: 12rem;
		overflow-y: auto;
	}
</style>
