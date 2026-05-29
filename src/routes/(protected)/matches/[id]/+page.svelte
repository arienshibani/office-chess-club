<script>
	import { enhance } from '$app/forms';
	import { Chess } from 'chess.js';
	import ChessBoard from '$lib/ChessBoard.svelte';
	import PlayerAvatar from '$lib/PlayerAvatar.svelte';
	import { detectNotationType } from '$lib/notation.js';

	let { data, form } = $props();
	let { match, white, black, canEditNotation, isAdmin } = $derived(data);
	let deleting = $state(false);

	const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

	let notationDraft = $state('');
	let savingNotation = $state(false);

	$effect(() => {
		notationDraft = match.notation ?? '';
	});

	let notationType = $derived(detectNotationType(match.notation));

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
						<PlayerAvatar
							icon={side.player?.icon}
							avatarUrl={side.player?.avatarUrl}
							size={20}
						/>
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
				{#if match.notation && notationType === 'fen'}
					<details class="pgn-raw">
						<summary>Raw FEN</summary>
						<pre>{match.notation}</pre>
					</details>
				{/if}
			</div>

			{#if isAdmin}
				<div class="admin-card">
					<h2>Admin</h2>
					<p class="admin-hint">
						{#if pending}
							Removes this match from history. Ratings were not applied yet.
						{:else}
							Removes this match and reverts both players’ ratings and win/loss/draw stats.
						{/if}
					</p>
					{#if form?.error && !canEditNotation}
						<p class="err">{form.error}</p>
					{/if}
					<form
						method="POST"
						action="?/deleteMatch"
						use:enhance={() => {
							deleting = true;
							return async ({ update }) => {
								await update();
								deleting = false;
							};
						}}
						onsubmit={(event) => {
							const message = pending
								? 'Delete this pending match?'
								: 'Delete this match and revert rating changes for both players?';
							if (!confirm(message)) event.preventDefault();
						}}
					>
						<button type="submit" class="delete-match-btn" disabled={deleting}>
							{deleting ? 'Deleting…' : 'Delete match'}
						</button>
					</form>
				</div>
			{/if}

			{#if canEditNotation}
				<div class="notation-form-card">
					<h2>{match.notation ? 'Update notation' : 'Add notation'}</h2>
					<p class="notation-hint">Only you and your opponent can edit this. Paste PGN moves or a FEN position.</p>
					{#if form?.error}
						<p class="err">{form.error}</p>
					{/if}
					{#if form?.notationSuccess}
						<p class="success">Notation saved.</p>
					{/if}
					<form
						method="POST"
						action="?/updateNotation"
						use:enhance={() => {
							savingNotation = true;
							return async ({ update }) => {
								await update();
								savingNotation = false;
							};
						}}
					>
						<textarea
							name="notation"
							bind:value={notationDraft}
							rows="6"
							placeholder="1. e4 e5 2. Nf3 Nc6 …&#10;or&#10;rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"
						></textarea>
						<div class="notation-actions">
							<button type="submit" disabled={savingNotation}>
								{savingNotation ? 'Saving…' : 'Save notation'}
							</button>
						</div>
					</form>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.match-page { display: flex; flex-direction: column; gap: 1.25rem; }
	.match-header { display: flex; align-items: center; gap: 1rem; }
	h1 { margin: 0; font-size: 1.2rem; }
	.back { color: var(--color-text-faint); text-decoration: none; font-size: 0.9rem; }
	.back:hover { color: var(--color-text-muted); }

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
	.err { color: var(--color-error); font-size: 0.85rem; margin: 0; }
	.fen-note { font-size: 0.82rem; color: var(--color-text-faint); margin: 0; }
	.muted { color: var(--color-text-extra-dim); }

	.controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		padding: 8px 12px;
	}
	.controls button {
		background: var(--color-surface-muted);
		border: 1px solid var(--color-border-strong);
		color: var(--color-text-soft);
		border-radius: 4px;
		padding: 4px 10px;
		cursor: pointer;
		font-size: 0.85rem;
	}
	.controls button:hover:not(:disabled) { background: var(--color-border-strong); }
	.controls button:disabled { opacity: 0.35; cursor: not-allowed; }
	.move-counter { flex: 1; text-align: center; font-size: 0.82rem; color: var(--color-text-faint); }

	.move-list {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		padding: 10px 12px;
		max-height: 180px;
		overflow-y: auto;
		font-size: 0.82rem;
		line-height: 1.8;
	}
	.move-num { color: var(--color-text-dim); margin-right: 2px; }
	.move-btn {
		background: none;
		border: none;
		color: var(--color-match-move-text);
		cursor: pointer;
		padding: 1px 5px;
		border-radius: 3px;
		font-size: 0.82rem;
		margin-right: 2px;
	}
	.move-btn:hover { background: var(--color-match-move-bg); color: var(--color-link-hover); }
	.move-btn.active { background: var(--color-match-move-active-bg); color: var(--color-link-hover); font-weight: 600; }

	/* Match info */
	.match-info { display: flex; flex-direction: column; gap: 1rem; }
	.result-banner {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 10px;
		padding: 1rem;
		text-align: center;
	}
	.result-label { font-size: 1.1rem; font-weight: 700; color: var(--color-text); }
	.result-label.pending { color: var(--color-warning); font-size: 0.9rem; }

	.players-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 10px;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.player-row { display: flex; align-items: center; gap: 10px; }
	.color-icon { font-size: 1.2rem; }
	.player-details { display: flex; flex-direction: column; gap: 2px; }
	.player-name { text-decoration: none; color: var(--color-text); font-weight: 600; font-size: 0.9rem; }
	.player-name:hover { color: var(--color-link-hover); }
	.elo-row { display: flex; align-items: center; gap: 4px; font-size: 0.8rem; }
	.elo-before, .elo-after { color: var(--color-text-subtle); }
	.arrow { color: var(--color-text-extra-dim); }
	.delta { font-weight: 700; }
	.delta.pos { color: var(--color-success); }
	.delta.neg { color: var(--color-error); }

	.meta-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 10px;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}
	.meta-row { display: flex; justify-content: space-between; font-size: 0.85rem; }
	.meta-label { color: var(--color-text-dim); }
	.notation-type { color: var(--color-text-subtle); text-transform: uppercase; font-size: 0.78rem; }

	.pgn-raw summary { font-size: 0.82rem; color: var(--color-text-dim); cursor: pointer; margin-top: 4px; }
	.pgn-raw pre {
		font-size: 0.72rem;
		color: var(--color-text-code);
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
	.pending-badge { background: var(--color-badge-pending-bg); color: var(--color-warning); border: 1px solid var(--color-badge-pending-border); }

	.admin-card {
		background: var(--color-surface);
		border: 1px solid var(--color-admin-reject-border);
		border-radius: 10px;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
	}
	.admin-card h2 { margin: 0; font-size: 0.95rem; font-weight: 600; color: var(--color-error); }
	.admin-hint { margin: 0; font-size: 0.8rem; color: var(--color-text-faint); line-height: 1.4; }
	.delete-match-btn {
		align-self: flex-start;
		padding: 8px 14px;
		border: 1px solid var(--color-admin-reject-border);
		border-radius: 6px;
		background: var(--color-admin-reject-bg);
		color: var(--color-error);
		font-weight: 600;
		font-size: 0.85rem;
		cursor: pointer;
	}
	.delete-match-btn:hover:not(:disabled) { background: var(--color-admin-reject-hover-bg); }
	.delete-match-btn:disabled { opacity: 0.6; cursor: not-allowed; }

	.notation-form-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 10px;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.notation-form-card h2 {
		margin: 0;
		font-size: 0.95rem;
		font-weight: 600;
	}
	.notation-hint {
		margin: 0;
		font-size: 0.8rem;
		color: var(--color-text-faint);
		line-height: 1.4;
	}
	.notation-form-card textarea {
		width: 100%;
		padding: 10px 12px;
		border-radius: 8px;
		border: 1px solid var(--color-login-input-border);
		background: var(--color-login-input-bg);
		color: var(--color-text);
		font-family: ui-monospace, monospace;
		font-size: 0.8rem;
		line-height: 1.5;
		resize: vertical;
	}
	.notation-form-card textarea:focus {
		outline: none;
		border-color: var(--color-text-dim);
	}
	.notation-actions {
		display: flex;
		justify-content: flex-end;
	}
	.notation-actions button {
		padding: 8px 14px;
		border: none;
		border-radius: 6px;
		background: var(--color-btn-primary-bg);
		color: var(--color-btn-primary-text);
		font-weight: 600;
		font-size: 0.85rem;
		cursor: pointer;
	}
	.notation-actions button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.success {
		margin: 0;
		font-size: 0.85rem;
		color: var(--color-success);
	}
</style>
