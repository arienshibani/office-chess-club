<script>
	/** @type {{ error: string, detail?: import('$lib/chess/notation.js').NotationErrorDetail | null }} */
	let { error, detail = null } = $props();

	const sideLabel = $derived(
		detail?.kind === 'illegal-move' ? (detail.side === 'white' ? 'White' : 'Black') : '',
	);
</script>

<div class="notation-error" role="alert">
	<p>{error}</p>
	{#if detail?.kind === 'illegal-move'}
		<p class="context"><code>{detail.context}</code></p>
		{#if detail.legalMoves.length > 0}
			<p class="legal">
				{detail.legalMoves.length === 1 ? 'Only legal move' : `Legal for ${sideLabel}`}:
				{#each detail.legalMoves as move, index (move)}
					<code>{move}</code>{index < detail.legalMoves.length - 1 ? ', ' : ''}
				{/each}
			</p>
		{/if}
	{:else if detail?.kind === 'syntax'}
		<pre>{detail.snippet}</pre>
	{:else if detail?.kind === 'fen'}
		<p class="legal">{detail.message}</p>
	{/if}
</div>

<style>
	.notation-error {
		font-size: 0.82rem;
		color: var(--color-error);
		background: var(--color-error-bg);
		border: 1px solid var(--color-error-border);
		border-radius: 6px;
		padding: 8px 10px;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	p {
		margin: 0;
	}

	.context,
	.legal {
		color: var(--color-text);
	}

	code,
	pre {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 0.78rem;
	}

	pre {
		margin: 0;
		white-space: pre-wrap;
		color: var(--color-text);
	}
</style>
