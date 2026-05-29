<script>
	/**
	 * Renders a chess board from a FEN string.
	 * Accepts `fen` prop for reactive updates.
	 */
	let { fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' } = $props();

	const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
	const RANKS = [8, 7, 6, 5, 4, 3, 2, 1];

	/** @type {Record<string, string>} */
	const PIECE_UNICODE = {
		K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
		k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟'
	};

	/**
	 * Parse FEN board string into a 2D array [rank8..rank1][fileA..fileH]
	 * @param {string} fenStr
	 * @returns {(string | null)[][]}
	 */
	function parseFen(fenStr) {
		const boardPart = fenStr.split(' ')[0];
		const ranks = boardPart.split('/');
		return ranks.map((rankStr) => {
			/** @type {(string | null)[]} */
			const row = [];
			for (const ch of rankStr) {
				if (/\d/.test(ch)) {
					for (let i = 0; i < parseInt(ch); i++) row.push(null);
				} else {
					row.push(ch);
				}
			}
			return row;
		});
	}

	let board = $derived(parseFen(fen));
</script>

<div class="board" role="img" aria-label="Chess board">
	{#each RANKS as rank, rankIdx}
		{#each FILES as file, fileIdx}
			{@const piece = board[rankIdx]?.[fileIdx] ?? null}
			{@const light = (rankIdx + fileIdx) % 2 === 0}
			{@const isWhitePiece = piece && piece === piece.toUpperCase()}
			<div
				class="square"
				class:light
				class:dark={!light}
				title="{file}{rank}"
			>
				{#if piece}
					<span class="piece" class:white-piece={isWhitePiece} class:black-piece={!isWhitePiece}>
						{PIECE_UNICODE[piece] ?? piece}
					</span>
				{/if}
				{#if fileIdx === 0}
					<span class="label rank-label">{rank}</span>
				{/if}
				{#if rankIdx === 7}
					<span class="label file-label">{file}</span>
				{/if}
			</div>
		{/each}
	{/each}
</div>

<style>
	.board {
		display: grid;
		grid-template-columns: repeat(8, 1fr);
		grid-template-rows: repeat(8, 1fr);
		width: 100%;
		max-width: min(480px, 100%);
		aspect-ratio: 1;
		margin: 0 auto;
		border: 2px solid #333;
		border-radius: 4px;
		overflow: hidden;
		user-select: none;
	}
	.square {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.light { background: #f0d9b5; }
	.dark { background: #b58863; }

	.piece {
		font-size: clamp(1.4rem, 4vw, 2.2rem);
		line-height: 1;
		cursor: default;
		filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4));
	}
	.white-piece { color: #fff; text-shadow: 0 0 2px #000, 0 0 4px #000; }
	.black-piece { color: #1a1a1a; text-shadow: 0 0 1px #fff; }

	.label {
		position: absolute;
		font-size: 0.55rem;
		font-weight: 700;
		opacity: 0.6;
		pointer-events: none;
		color: inherit;
	}
	.rank-label { top: 2px; left: 3px; }
	.file-label { bottom: 2px; right: 3px; }

	.light .label { color: #b58863; }
	.dark .label { color: #f0d9b5; }
</style>
