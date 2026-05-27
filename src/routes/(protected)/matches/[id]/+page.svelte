<script>
	import { Chess } from 'chess.js';
	import ChessBoard from '$lib/ChessBoard.svelte';

	let { data } = $props();
	let { match, white, black } = $derived(data);

	// Detect notation type
	const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

	/** @param {string | null} n */
	function detectType(n) {
		if (!n) return 'none';
		// FEN has slashes and spaces in a specific pattern
		if (/^[rnbqkpRNBQKP1-8\/]+ [wb] [KQkq\-]+ [a-h3-6\-]+ \d+ \d+$/.test(n.trim())) return 'fen';
		return 'pgn';
	}

	let notationType = $derived(detectType(match.notation));

	// PGN replay state
	/** @type {Chess} */
	let chess = $state(new Chess());
	/** @type {string[]} */
	let history = $state([]);
	let moveIndex = $state(-1);
	let currentFen = $state(INITIAL_FEN);
	let pgnError = $state('');
	let fenError = $state('');

	$effect(() => {
		if (notationType === 'pgn' && match.notation) {
			try {
				chess = new Chess();
				chess.loadPgn(match.notation);
				history = chess.history();
				moveIndex = history.length - 1;
				currentFen = chess.fen();
				pgnError = '';
			} catch (e) {
				pgnError = 'Could not parse PGN notation.';
				currentFen = INITIAL_FEN;
			}
		} else if (notationType === 'fen' && match.notation) {
			try {
				const c = new Chess();
				c.load(match.notation.trim());
				currentFen = c.fen();
				fenError = '';
			} catch (e) {
				fenError = 'Could not parse FEN string.';
				currentFen = INITIAL_FEN;
			}
		}
	});

	/** @param {number} idx */
	function goToMove(idx) {
		const c = new Chess();
		const moves = history.slice(0, idx + 1);
		for (const move of moves) {
			c.move(move);
		}
		currentFen = c.fen();
		moveIndex = idx;
	}

	function stepBack() {
		if (moveIndex > -1) goToMove(moveIndex - 1);
	}
	function stepForward() {
		if (moveIndex < history.length - 1) goToMove(moveIndex + 1);
	}
	function goToStart() {
		currentFen = INITIAL_FEN;
		moveIndex = -1;
	}
	function goToEnd() {
		if (history.length > 0) goToMove(history.length - 1);
	}

	// Elo display helpers
	let whiteElo = $derived(match.eloChange.white);
	let blackElo = $derived(match.eloChange.black);
	let whiteDelta = $derived(whiteElo.after - whiteElo.before);
	let blackDelta = $derived(blackElo.after - blackElo.before);

	let resultLabel = $derived(
		match.isDraw ? '½–½ Draw'
		: match.winnerId === match.whitePlayerId ? '1–0 White wins'
		: '0–1 Black wins'
	);

	let pending = $derived(match.status === 'pending');
</script>

<svelte:head><title>Match — Office Chess Club</title></svelte:head>

<div class="match-page">
	<div class="match-header">
		<a href="/" class="back">← Back</a>
		<h1>Match Review</h1>
		{#if pending}
			<span class="badge pending-badge">⚠ Pending Approval</span>
		{/if}
	</div>

	<div class="match-layout">
		<div class="board-section">
			{#if pgnError}
				<p class="err">{pgnError}</p>
			{/if}
			{#if fenError}
				<p class="err">{fenError}</p>
			{/if}

			<ChessBoard fen={currentFen} />

			{#if notationType === 'pgn' && history.length > 0}
				<div class="controls">
					<button onclick={goToStart} disabled={moveIndex === -1} title="Start">⏮</button>
					<button onclick={stepBack} disabled={moveIndex === -1} title="Back">◀</button>
					<span class="move-counter">
						{moveIndex === -1 ? 'Start' : `Move ${moveIndex + 1} / ${history.length}`}
					</span>
					<button onclick={stepForward} disabled={moveIndex === history.length - 1} title="Forward">▶</button>
					<button onclick={goToEnd} disabled={moveIndex === history.length - 1} title="End">⏭</button>
				</div>

				<div class="move-list">
					{#each history as move, i}
						{@const isPair = i % 2 === 0}
						{#if isPair}
							<span class="move-num">{Math.floor(i / 2) + 1}.</span>
						{/if}
						<button
							class="move-btn"
							class:active={i === moveIndex}
							onclick={() => goToMove(i)}
						>{move}</button>
					{/each}
				</div>
			{:else if notationType === 'fen'}
				<p class="fen-note">Showing final board position from FEN.</p>
			{:else if notationType === 'none'}
				<p class="fen-note muted">No notation recorded for this match.</p>
			{/if}
		</div>

		<div class="match-info">
			<div class="result-banner">
				<span class="result-label {pending ? 'pending' : ''}">{pending ? 'Estimated result' : resultLabel}</span>
			</div>

			<div class="players-card">
				{#each [
					{ player: white, elo: whiteElo, delta: whiteDelta, color: 'White', icon: '⬜' },
					{ player: black, elo: blackElo, delta: blackDelta, color: 'Black', icon: '⬛' }
				] as side}
					<div class="player-row">
						<span class="color-icon">{side.icon}</span>
						{#if side.player?.avatarUrl}
							<img src={side.player.avatarUrl} alt="" class="av" />
						{/if}
						<div class="player-details">
							<a href="/players/{side.player?._id}" class="player-name">
								{side.player?.name ?? 'Unknown'}
							</a>
							<div class="elo-row">
								<span class="elo-before">{side.elo.before}</span>
								<span class="arrow">→</span>
								<span class="elo-after">{side.elo.after}</span>
								<span class="delta" class:pos={side.delta > 0} class:neg={side.delta < 0}>
									{side.delta >= 0 ? '+' : ''}{side.delta}{pending ? ' (est.)' : ''}
								</span>
							</div>
						</div>
					</div>
				{/each}
			</div>

			<div class="meta-card">
				<div class="meta-row">
					<span class="meta-label">Date</span>
					<span>{new Date(match.playedAt).toLocaleString()}</span>
				</div>
				<div class="meta-row">
					<span class="meta-label">Notation</span>
					<span class="notation-type">{notationType === 'none' ? 'None' : notationType.toUpperCase()}</span>
				</div>
				{#if match.notation && notationType === 'pgn'}
					<details class="pgn-raw">
						<summary>Raw PGN</summary>
						<pre>{match.notation}</pre>
					</details>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.match-page { display: flex; flex-direction: column; gap: 1.25rem; }
	.match-header { display: flex; align-items: center; gap: 1rem; }
	h1 { margin: 0; font-size: 1.2rem; }
	.back { color: #666; text-decoration: none; font-size: 0.9rem; }
	.back:hover { color: #aaa; }

	.match-layout {
		display: grid;
		grid-template-columns: 1fr 300px;
		gap: 2rem;
		align-items: start;
	}
	@media (max-width: 780px) {
		.match-layout { grid-template-columns: 1fr; }
	}

	.board-section { display: flex; flex-direction: column; gap: 0.75rem; }
	.err { color: #f06060; font-size: 0.85rem; margin: 0; }
	.fen-note { font-size: 0.82rem; color: #666; margin: 0; }
	.muted { color: #444; }

	.controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: #141414;
		border: 1px solid #222;
		border-radius: 8px;
		padding: 8px 12px;
	}
	.controls button {
		background: #1e1e1e;
		border: 1px solid #2a2a2a;
		color: #ccc;
		border-radius: 4px;
		padding: 4px 10px;
		cursor: pointer;
		font-size: 0.85rem;
	}
	.controls button:hover:not(:disabled) { background: #2a2a2a; }
	.controls button:disabled { opacity: 0.35; cursor: not-allowed; }
	.move-counter { flex: 1; text-align: center; font-size: 0.82rem; color: #666; }

	.move-list {
		background: #141414;
		border: 1px solid #222;
		border-radius: 8px;
		padding: 10px 12px;
		max-height: 180px;
		overflow-y: auto;
		font-size: 0.82rem;
		line-height: 1.8;
	}
	.move-num { color: #555; margin-right: 2px; }
	.move-btn {
		background: none;
		border: none;
		color: #bbb;
		cursor: pointer;
		padding: 1px 5px;
		border-radius: 3px;
		font-size: 0.82rem;
		margin-right: 2px;
	}
	.move-btn:hover { background: #222; color: #fff; }
	.move-btn.active { background: #2a2a2a; color: #fff; font-weight: 600; }

	/* Match info */
	.match-info { display: flex; flex-direction: column; gap: 1rem; }
	.result-banner {
		background: #141414;
		border: 1px solid #222;
		border-radius: 10px;
		padding: 1rem;
		text-align: center;
	}
	.result-label { font-size: 1.1rem; font-weight: 700; color: #f0f0f0; }
	.result-label.pending { color: #e0a020; font-size: 0.9rem; }

	.players-card {
		background: #141414;
		border: 1px solid #222;
		border-radius: 10px;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.player-row { display: flex; align-items: center; gap: 10px; }
	.color-icon { font-size: 1.2rem; }
	.av { width: 32px; height: 32px; border-radius: 50%; }
	.player-details { display: flex; flex-direction: column; gap: 2px; }
	.player-name { text-decoration: none; color: #f0f0f0; font-weight: 600; font-size: 0.9rem; }
	.player-name:hover { color: #fff; }
	.elo-row { display: flex; align-items: center; gap: 4px; font-size: 0.8rem; }
	.elo-before, .elo-after { color: #888; }
	.arrow { color: #444; }
	.delta { font-weight: 700; }
	.delta.pos { color: #60c060; }
	.delta.neg { color: #e06060; }

	.meta-card {
		background: #141414;
		border: 1px solid #222;
		border-radius: 10px;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}
	.meta-row { display: flex; justify-content: space-between; font-size: 0.85rem; }
	.meta-label { color: #555; }
	.notation-type { color: #888; text-transform: uppercase; font-size: 0.78rem; }

	.pgn-raw summary { font-size: 0.82rem; color: #555; cursor: pointer; margin-top: 4px; }
	.pgn-raw pre {
		font-size: 0.72rem;
		color: #777;
		white-space: pre-wrap;
		word-break: break-word;
		margin: 6px 0 0;
		max-height: 120px;
		overflow-y: auto;
	}

	.badge {
		display: inline-block;
		padding: 3px 9px;
		border-radius: 5px;
		font-size: 0.78rem;
		font-weight: 500;
	}
	.pending-badge { background: #1a1000; color: #e0a020; border: 1px solid #332000; }
</style>
