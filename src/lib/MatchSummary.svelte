<script>
	import PieceColor from '$lib/PieceColor.svelte';

	/** @type {{ match: { isDraw: boolean, winnerId: string | null, whitePlayerId: string, whiteName: string, blackName: string }, class?: string }} */
	let { match, class: className = '' } = $props();
</script>

<span class="match-summary {className}">
	{#if match.isDraw}
		<PieceColor color="white" size={10} />
		<span class="name">{match.whiteName}</span>
		<span class="sep">½–½</span>
		<PieceColor color="black" size={10} />
		<span class="name">{match.blackName}</span>
	{:else if match.winnerId === match.whitePlayerId}
		<PieceColor color="white" size={10} />
		<span class="name">{match.whiteName}</span>
		<span class="sep">defeated</span>
		<PieceColor color="black" size={10} />
		<span class="name">{match.blackName}</span>
	{:else}
		<PieceColor color="black" size={10} />
		<span class="name">{match.blackName}</span>
		<span class="sep">defeated</span>
		<PieceColor color="white" size={10} />
		<span class="name">{match.whiteName}</span>
	{/if}
</span>

<style>
	.match-summary {
		display: inline-flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.35rem;
	}

	.sep {
		color: var(--color-text-faint);
		font-size: 0.88em;
	}
</style>
