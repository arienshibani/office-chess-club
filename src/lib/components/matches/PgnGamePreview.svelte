<script>
	import { Chess } from 'chess.js';
	import ChessBoard from '$lib/components/board/ChessBoard.svelte';
	import { detectNotationType } from '$lib/chess/notation.js';
	import { fenAtMoveIndex } from '$lib/chess/pgn-replay.js';

	/** @type {{ notation: string | null | undefined }} */
	let { notation } = $props();

	const replay = $derived.by(() => {
		const text = notation ?? '';
		if (!text || detectNotationType(text) !== 'pgn') {
			return { type: /** @type {const} */ ('none') };
		}
		try {
			const chess = new Chess();
			chess.loadPgn(text);
			const history = chess.history();
			return {
				type: /** @type {const} */ ('pgn'),
				history,
				finalFen: fenAtMoveIndex(history, history.length - 1),
			};
		} catch {
			return { type: /** @type {const} */ ('error') };
		}
	});
</script>

<div class="pgn-preview">
	{#if replay.type === 'pgn'}
		<div class="board-wrap">
			<ChessBoard fen={replay.finalFen} />
		</div>
		{#if replay.history.length > 0}
			<ol class="move-list">
				{#each replay.history as move, index}
					<li>
						{#if index % 2 === 0}
							<span class="move-num">{Math.floor(index / 2) + 1}.</span>
						{/if}
						<span class="san">{move}</span>
					</li>
				{/each}
			</ol>
		{/if}
	{:else if replay.type === 'error'}
		<p class="preview-error">Could not preview this PGN.</p>
	{:else}
		<p class="preview-empty">No game preview available.</p>
	{/if}
</div>

<style>
	.pgn-preview {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.board-wrap {
		width: min(100%, 280px);
		margin: 0 auto;
	}

	.move-list {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 10px;
		list-style: none;
		margin: 0;
		padding: 0;
		max-height: 120px;
		overflow-y: auto;
		font-size: 0.82rem;
		color: var(--color-text-subtle);
	}

	.move-list li {
		display: inline-flex;
		align-items: baseline;
		gap: 4px;
	}

	.move-num {
		color: var(--color-text-faint);
		font-size: 0.75rem;
	}

	.san {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
	}

	.preview-error,
	.preview-empty {
		margin: 0;
		font-size: 0.82rem;
		color: var(--color-text-faint);
	}
</style>
