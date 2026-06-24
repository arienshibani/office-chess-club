<script>
	import BoardArrows from '$lib/components/board/BoardArrows.svelte';
	import { slideDeltaPx, squareToPercent } from '$lib/chess/board-coords.js';
	import { pieceSvgUrl } from '$lib/chess/pieces.js';
	import { suggestionArrowLabel } from '$lib/chess/arrows.js';

	/**
	 * Renders a chess board from a FEN string.
	 * `suggestion` draws a dashed arrow + ghost piece (engine best move, not played).
	 */
	const props = $props();
	const fen = $derived(
		props.fen ?? 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
	);
	/** @type {import('$lib/chess/arrows.js').SuggestionDisplay | null} */
	const suggestion = $derived(props.suggestion ?? null);
	/** @type {string[]} */
	const hiddenSquares = $derived(props.hiddenSquares ?? []);
	/** @type {{ piece: string, from: string, to: string, active?: boolean, id?: string }[]} */
	const flyingPieces = $derived(
		props.flyingPieces ?? (props.flyingPiece ? [props.flyingPiece] : []),
	);
	const boardLabel = $derived(
		suggestion ? `Chess board. ${suggestionArrowLabel(suggestion)}` : 'Chess board'
	);

	const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
	const RANKS = [8, 7, 6, 5, 4, 3, 2, 1];

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
					for (let i = 0; i < parseInt(ch, 10); i++) row.push(null);
				} else {
					row.push(ch);
				}
			}
			return row;
		});
	}

	let board = $derived(parseFen(fen));

	let containerEl = $state(/** @type {HTMLDivElement | null} */ (null));
	let boardPx = $state(0);

	$effect(() => {
		const el = containerEl;
		if (!el) return;

		const measure = () => {
			boardPx = el.getBoundingClientRect().width;
		};

		measure();
		const ro = new ResizeObserver(measure);
		ro.observe(el);
		return () => ro.disconnect();
	});
</script>

<div class="board-container" bind:this={containerEl}>
	<div class="board" role="img" aria-label={boardLabel}>
	{#each RANKS as rank, rankIdx}
		{#each FILES as file, fileIdx}
			{@const piece = board[rankIdx]?.[fileIdx] ?? null}
			{@const squareName = `${file}${rank}`}
			{@const isSuggestionTarget = suggestion?.to === squareName}
			{@const hidePiece = hiddenSquares.includes(squareName)}
			{@const light = (rankIdx + fileIdx) % 2 === 0}
			<div
				class="square"
				class:light
				class:dark={!light}
				title="{file}{rank}"
			>
				{#if piece && !hidePiece}
					<img
						class="piece-img"
						src={pieceSvgUrl(piece)}
						alt=""
						draggable="false"
					/>
				{/if}
				{#if isSuggestionTarget && suggestion}
					<img
						class="piece-img suggestion-ghost"
						src={pieceSvgUrl(suggestion.piece)}
						alt=""
						draggable="false"
					/>
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
	{#each flyingPieces as flight (flight.id ?? `${flight.from}-${flight.to}-${flight.piece}`)}
		{@const from = squareToPercent(flight.from)}
		{@const delta = boardPx > 0 ? slideDeltaPx(flight.from, flight.to, boardPx) : { x: 0, y: 0 }}
		<img
			class="piece-img flying-piece"
			class:fly-active={flight.active}
			style="--from-left: {from.left}%; --from-top: {from.top}%; --dx-px: {delta.x}px; --dy-px: {delta.y}px"
			src={pieceSvgUrl(flight.piece)}
			alt=""
			draggable="false"
		/>
	{/each}
	<BoardArrows arrow={suggestion} />
</div>

<style>
	.board-container {
		position: relative;
		width: 100%;
		max-width: min(480px, 100%);
		aspect-ratio: 1 / 1;
	}

	.board {
		position: absolute;
		inset: 0;
		display: grid;
		grid-template-columns: repeat(8, minmax(0, 1fr));
		grid-template-rows: repeat(8, minmax(0, 1fr));
		margin: 0;
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
		min-width: 0;
		min-height: 0;
	}
	.light { background: #f0d9b5; }
	.dark { background: #b58863; }

	.piece-img {
		width: 88%;
		max-height: 88%;
		height: auto;
		object-fit: contain;
		pointer-events: none;
		user-select: none;
		-webkit-user-drag: none;
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.35));
	}

	.suggestion-ghost {
		position: absolute;
		z-index: 3;
		opacity: 0.42;
		filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.25));
	}

	.flying-piece {
		position: absolute;
		width: 11%;
		height: 11%;
		left: var(--from-left);
		top: var(--from-top);
		transform: translate3d(-50%, -50%, 0);
		z-index: 12;
		will-change: transform;
		transition: transform 280ms cubic-bezier(0.25, 0.8, 0.25, 1);
		pointer-events: none;
	}

	.flying-piece.fly-active {
		transform: translate3d(calc(-50% + var(--dx-px)), calc(-50% + var(--dy-px)), 0);
	}

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
