<script>
	import { browser } from '$app/environment';
	import { enhance } from '$app/forms';
	import {
		ArrowRight,
		ChevronFirst,
		ChevronLast,
		ChevronLeft,
		ChevronRight,
		Lightbulb,
		Save
	} from '@lucide/svelte';
	import { buildSuggestionDisplay } from '$lib/chess-arrows.js';
	import { withActionToast } from '$lib/action-toast.js';
	import ChessBoard from '$lib/ChessBoard.svelte';
	import EvalBar from '$lib/EvalBar.svelte';
	import MatchActionsMenu from '$lib/MatchActionsMenu.svelte';
	import { fenAtMoveIndex, INITIAL_FEN } from '$lib/pgn-replay.js';
	import { analyzeHistory } from '$lib/stockfish/analyze-timeline.js';
	import { stopEngine } from '$lib/stockfish/engine.js';
	import PieceColor from '$lib/PieceColor.svelte';
	import PlayerAvatar from '$lib/PlayerAvatar.svelte';
	import ResultBadge from '$lib/ResultBadge.svelte';
	import { detectNotationType } from '$lib/notation.js';
	import { Chess } from 'chess.js';

	const props = $props();
	const data = $derived(props.data);
	const form = $derived(props.form);
	let { match, white, black, canEditNotation, isAdmin } = $derived(data);

	let notationDraft = $state('');
	let savingNotation = $state(false);
	let notationSaveFeedback = $state(/** @type {string | null} */ (null));
	let notationFormOpen = $state(false);

	$effect(() => {
		if (form?.error && canEditNotation) notationFormOpen = true;
	});

	$effect(() => {
		if (notationSaveFeedback) notationFormOpen = true;
	});

	$effect(() => {
		notationDraft = match.notation ?? '';
	});

	let notationType = $derived(detectNotationType(match.notation));

	/** @type {{ type: 'pgn', history: string[] } | { type: 'fen', fen: string } | { type: 'error', kind: 'pgn' | 'fen' } | { type: 'none' }} */
	const replaySource = $derived.by(() => {
		const notation = match.notation ?? '';
		const type = detectNotationType(notation);
		if (type === 'pgn' && notation) {
			try {
				const c = new Chess();
				c.loadPgn(notation);
				return { type: /** @type {const} */ ('pgn'), history: c.history() };
			} catch {
				return { type: /** @type {const} */ ('error'), kind: /** @type {const} */ ('pgn') };
			}
		}
		if (type === 'fen' && notation) {
			try {
				const c = new Chess();
				c.load(notation.trim());
				return { type: /** @type {const} */ ('fen'), fen: c.fen() };
			} catch {
				return { type: /** @type {const} */ ('error'), kind: /** @type {const} */ ('fen') };
			}
		}
		return { type: /** @type {const} */ ('none') };
	});

	let history = $derived(replaySource.type === 'pgn' ? replaySource.history : []);
	let pgnError = $derived(replaySource.type === 'error' && replaySource.kind === 'pgn');
	let fenError = $derived(replaySource.type === 'error' && replaySource.kind === 'fen');

	/** Index of the current move in SAN history (-1 = starting position). */
	let viewIndex = $state(-1);
	let lastReplayKey = $state('');

	$effect(() => {
		const notation = match.notation ?? '';
		const key = `${match._id}:${notation}`;
		if (key === lastReplayKey) return;
		lastReplayKey = key;
		if (detectNotationType(notation) === 'pgn' && notation) {
			try {
				const c = new Chess();
				c.loadPgn(notation);
				viewIndex = c.history().length - 1;
			} catch {
				viewIndex = -1;
			}
		} else {
			viewIndex = -1;
		}
	});

	const currentFen = $derived.by(() => {
		if (replaySource.type === 'fen') return replaySource.fen;
		if (replaySource.type === 'pgn') {
			return fenAtMoveIndex(replaySource.history, viewIndex);
		}
		return INITIAL_FEN;
	});

	/** @type {({ cp?: number, mate?: number } | null)[]} */
	let evals = $state([]);
	let analysisLoading = $state(false);
	let analysisAvailable = $state(true);
	let analysisProgress = $state(/** @type {{ done: number, total: number } | null} */ (null));

	let currentEval = $derived(evals[viewIndex + 1] ?? null);
	let showSuggestions = $state(true);

	let activeSuggestion = $derived(
		showSuggestions ? buildSuggestionDisplay(currentFen, currentEval?.bestMove) : null
	);

	/** @param {number} idx */
	const goToMove = (idx) => {
		viewIndex = idx;
	};

	const stepBack = () => {
		if (viewIndex > -1) viewIndex -= 1;
	};
	const stepForward = () => {
		if (viewIndex < history.length - 1) viewIndex += 1;
	};
	const goToStart = () => {
		viewIndex = -1;
	};
	const goToEnd = () => {
		if (history.length > 0) viewIndex = history.length - 1;
	};

	let replayActive = $derived(notationType === 'pgn' && history.length > 0);

	$effect(() => {
		if (!browser) return;
		const key = lastReplayKey;
		const notation = match.notation ?? '';
		if (!key || detectNotationType(notation) !== 'pgn' || !notation) return;

		let moves;
		try {
			const c = new Chess();
			c.loadPgn(notation);
			moves = c.history();
		} catch {
			return;
		}
		if (!moves.length) return;

		const ac = new AbortController();

		analysisLoading = true;
		analysisAvailable = true;
		analysisProgress = null;
		evals = [];

		analyzeHistory(moves, {
			signal: ac.signal,
			onProgress: (point, index, total) => {
				const next = [...evals];
				while (next.length < total) next.push(null);
				next[index] = point;
				evals = next;
				analysisProgress = { done: index + 1, total };
			}
		})
			.then((results) => {
				if (!ac.signal.aborted) evals = results;
			})
			.catch((err) => {
				if (err?.name !== 'AbortError') {
					console.error('Stockfish analysis failed:', err);
					analysisAvailable = false;
				}
			})
			.finally(() => {
				if (!ac.signal.aborted) {
					analysisLoading = false;
					analysisProgress = null;
				}
			});

		return () => {
			ac.abort();
			stopEngine();
		};
	});

	$effect(() => {
		if (!browser || !replayActive) return;

		/** @param {KeyboardEvent} e */
		const onKeyDown = (e) => {
			const replayKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
			if (!replayKeys.includes(e.key)) return;
			const el = document.activeElement;
			if (
				el instanceof HTMLInputElement ||
				el instanceof HTMLTextAreaElement ||
				el instanceof HTMLSelectElement ||
				(el instanceof HTMLElement && el.isContentEditable)
			) {
				return;
			}
			e.preventDefault();
			if (e.key === 'ArrowLeft') stepBack();
			else if (e.key === 'ArrowRight') stepForward();
			else if (e.key === 'ArrowUp') goToStart();
			else goToEnd();
		};

		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	});

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

	let currentResult = $derived(
		match.isDraw ? 'draw' : match.winnerId === match.whitePlayerId ? 'white' : 'black'
	);
</script>

<svelte:head><title>Match — Office Chess Club</title></svelte:head>

<div class="match-page">
	<div class="match-header">
		<a href="/" class="back with-icon">
			<ChevronLeft size={16} aria-hidden="true" />
			Back
		</a>
		<h1>Match Review</h1>
		{#if pending}
			<ResultBadge variant="pending" label="Pending Approval" />
		{/if}
		{#if isAdmin}
			<MatchActionsMenu
				matchId={match._id}
				status={match.status}
				result={currentResult}
				whiteName={white?.name ?? 'White'}
				blackName={black?.name ?? 'Black'}
				deleteAction="?/deleteMatch"
				correctAction="?/correctResult"
			/>
		{/if}
	</div>

	<div class="match-layout">
		<div class="board-section">
			{#if pgnError}
				<p class="err">Could not parse PGN notation.</p>
			{/if}
			{#if fenError}
				<p class="err">Could not parse FEN string.</p>
			{/if}

			<div
				class="board-with-eval"
				class:with-eval={replayActive && analysisAvailable}
			>
				<div class="board-wrap">
					<ChessBoard fen={currentFen} suggestion={activeSuggestion} />
				</div>
				{#if replayActive && analysisAvailable}
					<EvalBar
						eval={currentEval}
						loading={analysisLoading && currentEval == null}
					/>
				{/if}
			</div>

			{#if notationType === 'pgn' && history.length > 0}
				<div class="analysis-progress-slot" aria-live="polite">
					{#if analysisProgress}
						<p class="analysis-progress">
							Analyzing {analysisProgress.done}/{analysisProgress.total}…
						</p>
					{:else if showSuggestions && activeSuggestion}
						<p class="suggestion-hint">
							Gray arrow and faded piece = engine suggestion (not played in this game).
						</p>
					{/if}
				</div>
				<div class="controls">
					<button type="button" onclick={goToStart} disabled={viewIndex === -1} title="Start (↑)" aria-label="Go to start">
						<ChevronFirst size={16} aria-hidden="true" />
					</button>
					<button type="button" onclick={stepBack} disabled={viewIndex === -1} title="Back (←)" aria-label="Previous move">
						<ChevronLeft size={16} aria-hidden="true" />
					</button>
					<span class="move-counter">
						{viewIndex === -1 ? 'Start' : `Move ${viewIndex + 1} / ${history.length}`}
					</span>
					<button type="button" onclick={stepForward} disabled={viewIndex === history.length - 1} title="Forward (→)" aria-label="Next move">
						<ChevronRight size={16} aria-hidden="true" />
					</button>
					<button type="button" onclick={goToEnd} disabled={viewIndex === history.length - 1} title="End (↓)" aria-label="Go to end">
						<ChevronLast size={16} aria-hidden="true" />
					</button>
					<button
						type="button"
						class="suggestion-toggle with-icon"
						class:active={showSuggestions}
						onclick={() => {
							showSuggestions = !showSuggestions;
						}}
						title={showSuggestions ? 'Hide engine suggestions' : 'Show engine suggestions'}
						aria-pressed={showSuggestions}
						aria-label={showSuggestions ? 'Hide engine suggestions' : 'Show engine suggestions'}
					>
						<Lightbulb size={15} aria-hidden="true" />
						<span class="suggestion-toggle-label">Hints</span>
					</button>
				</div>

				<div class="move-list">
					{#each history as move, i}
						{@const isPair = i % 2 === 0}
						{#if isPair}
							<span class="move-num">{Math.floor(i / 2) + 1}.</span>
						{/if}
						<button
							type="button"
							class="move-btn"
							class:active={i === viewIndex}
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
					{ player: white, elo: whiteElo, delta: whiteDelta, color: 'white' },
					{ player: black, elo: blackElo, delta: blackDelta, color: 'black' }
				] as side}
					<div class="player-row">
						<PieceColor color={side.color} size={14} />
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
								<ArrowRight size={14} class="arrow-icon" aria-hidden="true" />
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

			{#if isAdmin && form?.error && !canEditNotation}
				<p class="err admin-err">{form.error}</p>
			{/if}

			{#if canEditNotation}
				<details class="notation-form-card" bind:open={notationFormOpen}>
					<summary class="notation-form-summary with-icon">
						<ChevronRight size={15} class="notation-chevron" aria-hidden="true" />
						<span class="notation-form-title">
							{match.notation ? 'Update notation' : 'Add notation'}
						</span>
					</summary>
					<div class="notation-form-body">
					<p class="notation-hint">Only you and your opponent can edit this. Paste PGN moves or a FEN position.</p>
					{#if form?.error}
						<p class="err">{form.error}</p>
					{/if}
					{#if notationSaveFeedback}
						<p class="success">{notationSaveFeedback}</p>
					{/if}
					<form
						method="POST"
						action="?/updateNotation"
						use:enhance={() => {
							return async (ctx) => {
								savingNotation = true;
								try {
									await withActionToast({
										invalidate: [`app:match:${match._id}`]
									})(ctx);
									if (ctx.result.type === 'success') {
										const payload = /** @type {Record<string, unknown>} */ (
											ctx.result.data ?? {}
										);
										notationSaveFeedback =
											typeof payload.message === 'string'
												? payload.message
												: 'Notation saved.';
									}
								} finally {
									savingNotation = false;
								}
							};
						}}
					>
						<textarea
							name="notation"
							bind:value={notationDraft}
							rows="6"
							placeholder="1. e4 e5 2. Nf3 Nc6 …&#10;or&#10;rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"
							oninput={() => {
								notationSaveFeedback = null;
							}}
						></textarea>
						<div class="notation-actions">
							<button type="submit" class="with-icon" disabled={savingNotation}>
								<Save size={15} aria-hidden="true" />
								{savingNotation ? 'Saving…' : 'Save notation'}
							</button>
						</div>
					</form>
					</div>
				</details>
			{/if}
		</div>
	</div>
</div>

<style>
	.match-page { display: flex; flex-direction: column; gap: 1.25rem; }
	.match-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}
	h1 { margin: 0; font-size: 1.2rem; flex: 1; min-width: 0; }
	.back { color: var(--color-text-faint); text-decoration: none; font-size: 0.9rem; }
	.back:hover { color: var(--color-text-muted); }

	:global(.arrow-icon) {
		color: var(--color-text-extra-dim);
		flex-shrink: 0;
	}

	.match-layout {
		display: grid;
		grid-template-columns: 1fr 300px;
		gap: 2rem;
		align-items: start;
	}
	@media (max-width: 900px) {
		.match-layout { grid-template-columns: 1fr; }
	}

	@media (max-width: 640px) {
		.match-header h1 { font-size: 1.05rem; }
		.controls { flex-wrap: wrap; }
		.move-list { max-height: 140px; }
		.player-row { flex-wrap: wrap; }
	}

	.board-section { display: flex; flex-direction: column; gap: 0.75rem; }

	.board-with-eval {
		display: grid;
		grid-template-columns: minmax(0, min(480px, 100%));
		align-items: stretch;
		width: fit-content;
		max-width: 100%;
	}

	.board-with-eval.with-eval {
		grid-template-columns: minmax(0, min(480px, 100%)) 2.75rem;
		gap: 0.5rem;
	}

	.board-wrap {
		min-width: 0;
		width: 100%;
	}

	.board-wrap :global(.board-container) {
		margin: 0;
		max-width: 100%;
	}

	.analysis-progress-slot {
		min-height: 1.15rem;
		margin: 0;
	}

	.analysis-progress,
	.suggestion-hint {
		margin: 0;
		font-size: 0.78rem;
		color: var(--color-text-faint);
	}

	.suggestion-hint {
		color: var(--color-text-dim);
	}

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
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: var(--color-surface-muted);
		border: 1px solid var(--color-border-strong);
		color: var(--color-text-soft);
		border-radius: 4px;
		padding: 4px 10px;
		cursor: pointer;
		font-size: 0.85rem;
		min-width: 36px;
		min-height: 32px;
	}
	.controls button:hover:not(:disabled) { background: var(--color-border-strong); }
	.controls button:disabled { opacity: 0.35; cursor: not-allowed; }

	.suggestion-toggle {
		margin-left: auto;
		gap: 0.35rem;
		padding: 4px 10px;
		min-width: auto;
	}

	.suggestion-toggle-label {
		font-size: 0.78rem;
		font-weight: 600;
	}

	.suggestion-toggle.active {
		background: var(--color-border-strong);
		color: var(--color-text);
		border-color: var(--color-text-dim);
	}

	.suggestion-toggle:not(.active) {
		opacity: 0.65;
	}

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

	.admin-err { margin-top: 0; }

	.notation-form-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 10px;
	}

	.notation-form-summary {
		padding: 1rem;
		cursor: pointer;
		list-style: none;
		color: var(--color-text-soft);
	}

	.notation-form-summary::-webkit-details-marker {
		display: none;
	}

	.notation-form-title {
		font-size: 0.95rem;
		font-weight: 600;
	}

	:global(.notation-chevron) {
		color: var(--color-text-faint);
		flex-shrink: 0;
		transition: transform 0.15s ease;
	}

	.notation-form-card[open] :global(.notation-chevron) {
		transform: rotate(90deg);
	}

	.notation-form-body {
		padding: 0 1rem 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
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
		padding-top: 0.5rem;
	}
	.notation-actions button {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
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
