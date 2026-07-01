<script>
import {
	CalendarDays,
	ChevronFirst,
	ChevronLast,
	ChevronLeft,
	ChevronRight,
	Clock3,
	FileCode2,
	Lightbulb,
	Save,
} from "@lucide/svelte";
import { Chess } from "chess.js";
import { browser } from "$app/environment";
import { page } from "$app/state";
import { enhance } from "$app/forms";
import { withActionToast } from "$lib/client/action-toast.js";
import ChessBoard from "$lib/components/board/ChessBoard.svelte";
import { buildSuggestionDisplay } from "$lib/chess/arrows.js";
import EvalBar from "$lib/components/board/EvalBar.svelte";
import MatchActionsMenu from "$lib/components/matches/MatchActionsMenu.svelte";
import { detectNotationType } from "$lib/chess/notation.js";
import PieceColor from "$lib/components/player/PieceColor.svelte";
import {
	clampMoveIndex,
	formatMoveHash,
	moveAnchorId,
	parseMoveHash,
} from "$lib/chess/move-hash.js";
import { INITIAL_FEN } from "$lib/chess/pgn-replay.js";
import { createSlideReplayDriver } from "$lib/chess/pgn-slide-animation.js";
import ResultBadge from "$lib/components/matches/ResultBadge.svelte";
import { analyzeHistory } from "$lib/stockfish/analyze-timeline.js";
import { stopEngine } from "$lib/stockfish/engine.js";
import {
	computeClockStateByPly,
	extractElapsedMoveTimes,
	formatClockSeconds,
	getTimeFormatLabel,
	parseTimeFormatValue,
} from "$lib/chess/time-control.js";

const {
	match,
	white,
	black,
	canEditNotation = false,
	isAdmin = false,
	form = null,
	embedded = false,
} = $props();

let notationDraft = $state("");
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
	notationDraft = match.notation ?? "";
});

const notationType = $derived(detectNotationType(match.notation));

/** @type {{ type: 'pgn', history: string[], verboseMoves: import('chess.js').Move[] } | { type: 'fen', fen: string } | { type: 'error', kind: 'pgn' | 'fen' } | { type: 'none' }} */
const replaySource = $derived.by(() => {
	const notation = match.notation ?? "";
	const type = detectNotationType(notation);
	if (type === "pgn" && notation) {
		try {
			const c = new Chess();
			c.loadPgn(notation);
			return {
				type: /** @type {const} */ ("pgn"),
				history: c.history(),
				verboseMoves: c.history({ verbose: true }),
			};
		} catch {
			return {
				type: /** @type {const} */ ("error"),
				kind: /** @type {const} */ ("pgn"),
			};
		}
	}
	if (type === "fen" && notation) {
		try {
			const c = new Chess();
			c.load(notation.trim());
			return { type: /** @type {const} */ ("fen"), fen: c.fen() };
		} catch {
			return {
				type: /** @type {const} */ ("error"),
				kind: /** @type {const} */ ("fen"),
			};
		}
	}
	return { type: /** @type {const} */ ("none") };
});

const history = $derived(
	replaySource.type === "pgn" ? replaySource.history : [],
);
const verboseMoves = $derived(
	replaySource.type === "pgn" ? replaySource.verboseMoves : [],
);
const pgnError = $derived(
	replaySource.type === "error" && replaySource.kind === "pgn",
);
const fenError = $derived(
	replaySource.type === "error" && replaySource.kind === "fen",
);

/** Index of the current move in SAN history (-1 = starting position). */
let viewIndex = $state(-1);
let boardFen = $state(INITIAL_FEN);
let hiddenSquares = $state(/** @type {string[]} */ ([]));
let flyingPieces = $state(
	/** @type {{ piece: string, from: string, to: string, active?: boolean, id?: string }[]} */ ([]),
);
let isAnimating = $state(false);
let navTarget = $state(-1);
let lastReplayKey = $state("");

const replayDriver = createSlideReplayDriver({
	getSanHistory: () => history,
	getVerboseMoves: () => verboseMoves,
	getViewIndex: () => viewIndex,
	setViewIndex: (index) => {
		viewIndex = index;
	},
	setBoardFen: (fen) => {
		boardFen = fen;
	},
	setHiddenSquares: (squares) => {
		hiddenSquares = squares;
	},
	setFlyingPieces: (pieces) => {
		flyingPieces = pieces;
	},
	setIsAnimating: (animating) => {
		isAnimating = animating;
	},
});

const syncNav = () => {
	navTarget = replayDriver.getTargetIndex();
};

const snapToIndex = (/** @type {number} */ index) => {
	replayDriver.snapToIndex(index);
	syncNav();
};

const scrollMoveIntoView = (/** @type {number} */ index) => {
	if (!browser || index < 0) return;
	requestAnimationFrame(() => {
		document.getElementById(moveAnchorId(index))?.scrollIntoView({
			block: "nearest",
			behavior: "smooth",
		});
	});
};

const syncMoveHashToIndex = (/** @type {number} */ index) => {
	if (!browser || embedded) return;
	const hash = formatMoveHash(index);
	const current = window.location.hash.replace(/^#/, "").toLowerCase();
	if (current === hash) return;
	const url = new URL(window.location.href);
	url.hash = hash;
	window.history.replaceState(window.history.state, "", url);
};

const resolveInitialViewIndex = (/** @type {number} */ moveCount) => {
	if (moveCount === 0) return -1;
	if (!embedded && browser) {
		const fromHash = clampMoveIndex(parseMoveHash(page.url.hash), moveCount);
		if (fromHash != null) return fromHash;
	}
	return moveCount - 1;
};

$effect(() => {
	const notation = match.notation ?? "";
	const key = `${match._id}:${notation}`;
	if (key === lastReplayKey) return;
	lastReplayKey = key;
	if (detectNotationType(notation) === "pgn" && notation) {
		try {
			const c = new Chess();
			c.loadPgn(notation);
			const moves = c.history();
			const initialIndex = resolveInitialViewIndex(moves.length);
			snapToIndex(initialIndex);
			if (!embedded && browser && page.url.hash) {
				scrollMoveIntoView(initialIndex);
			}
		} catch {
			snapToIndex(-1);
		}
	} else {
		viewIndex = -1;
		boardFen =
			replaySource.type === "fen" ? replaySource.fen : INITIAL_FEN;
		hiddenSquares = [];
		flyingPieces = [];
		isAnimating = false;
	}
});

const boardDisplayFen = $derived.by(() => {
	if (replaySource.type === "fen") return replaySource.fen;
	if (replaySource.type === "pgn") return boardFen;
	return INITIAL_FEN;
});

/** @type {({ cp?: number, mate?: number, bestMove?: { from: string, to: string } | null } | null)[]} */
let evals = $state([]);
let analysisLoading = $state(false);
let analysisAvailable = $state(true);
let analysisProgress = $state(
	/** @type {{ done: number, total: number } | null} */ (null),
);

const currentEval = $derived(evals[viewIndex + 1] ?? null);
let showSuggestions = $state(false);

const activeSuggestion = $derived(
	showSuggestions
		? buildSuggestionDisplay(boardDisplayFen, currentEval?.bestMove)
		: null,
);

const navigateReplay = (/** @type {number} */ index) => {
	replayDriver.requestIndex(index);
	syncNav();
	syncMoveHashToIndex(index);
};

/** @param {number} idx */
const goToMove = (idx) => {
	navigateReplay(idx);
};

const stepBack = () => {
	replayDriver.stepBack();
	syncNav();
	syncMoveHashToIndex(replayDriver.getTargetIndex());
};
const stepForward = () => {
	replayDriver.stepForward();
	syncNav();
	syncMoveHashToIndex(replayDriver.getTargetIndex());
};
const goToStart = () => {
	navigateReplay(-1);
};
const goToEnd = () => {
	if (history.length > 0) {
		navigateReplay(history.length - 1);
	}
};

$effect(() => {
	viewIndex;
	syncNav();
});

const replayActive = $derived(notationType === "pgn" && history.length > 0);
const moveElapsedByPly = $derived.by(() => {
	if (notationType !== "pgn" || !match.notation) return [];
	const elapsed = extractElapsedMoveTimes(match.notation);
	return history.map((_, index) => elapsed[index] ?? null);
});
const hasMoveTimingData = $derived(
	moveElapsedByPly.some((item) => typeof item === "number"),
);
const timeControl = $derived.by(() => {
	if (
		match.timeControl &&
		typeof match.timeControl.baseSeconds === "number" &&
		typeof match.timeControl.incrementSeconds === "number"
	) {
		return match.timeControl;
	}
	return parseTimeFormatValue(match.timeFormat);
});
const clockStateByPly = $derived.by(() => {
	if (!timeControl || !hasMoveTimingData) return [];
	return computeClockStateByPly(
		moveElapsedByPly,
		timeControl.baseSeconds,
		timeControl.incrementSeconds,
	);
});
const currentClock = $derived.by(() => {
	if (!timeControl) return null;
	if (viewIndex < 0) {
		return {
			white: timeControl.baseSeconds,
			black: timeControl.baseSeconds,
		};
	}
	return clockStateByPly[viewIndex] ?? null;
});

$effect(() => {
	if (!browser || embedded) return;
	const key = lastReplayKey;
	const notation = match.notation ?? "";
	if (!key || detectNotationType(notation) !== "pgn" || !notation) return;

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
		/** @param {{ cp?: number, mate?: number, bestMove?: { from: string, to: string } | null }} point @param {number} index @param {number} total */
		onProgress: (point, index, total) => {
			const next = [...evals];
			while (next.length < total) next.push(null);
			next[index] = point;
			evals = next;
			analysisProgress = { done: index + 1, total };
		},
	})
		.then((results) => {
			if (!ac.signal.aborted) evals = results;
		})
		.catch((err) => {
			if (err?.name !== "AbortError") {
				console.error("Stockfish analysis failed:", err);
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
		const replayKeys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
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
		if (e.key === "ArrowLeft") stepBack();
		else if (e.key === "ArrowRight") stepForward();
		else if (e.key === "ArrowUp") goToStart();
		else goToEnd();
	};

	window.addEventListener("keydown", onKeyDown);
	return () => window.removeEventListener("keydown", onKeyDown);
});

$effect(() => {
	if (!browser || embedded || !replayActive) return;

	const onHashChange = () => {
		const index = clampMoveIndex(
			parseMoveHash(window.location.hash),
			history.length,
		);
		if (index == null || index === replayDriver.getTargetIndex()) return;
		snapToIndex(index);
		scrollMoveIntoView(index);
	};

	window.addEventListener("hashchange", onHashChange);
	return () => window.removeEventListener("hashchange", onHashChange);
});

// Elo display helpers
const whiteElo = $derived(match.eloChange.white);
const blackElo = $derived(match.eloChange.black);
const whiteDelta = $derived(whiteElo.after - whiteElo.before);
const blackDelta = $derived(blackElo.after - blackElo.before);

const resultLabel = $derived(
	match.isDraw
		? "½–½ Draw"
		: match.winnerId === match.whitePlayerId
			? "1–0 White wins"
			: "0–1 Black wins",
);

const pending = $derived(match.status === "pending");

const currentResult = $derived(
	match.isDraw
		? "draw"
		: match.winnerId === match.whitePlayerId
			? "white"
			: "black",
);

const moveRows = $derived.by(() => {
	/** @type {{ number: number, whiteIndex: number, white: string, blackIndex: number | null, black: string | null }[]} */
	const rows = [];
	for (let i = 0; i < history.length; i += 2) {
		rows.push({
			number: Math.floor(i / 2) + 1,
			whiteIndex: i,
			white: history[i],
			blackIndex: i + 1 < history.length ? i + 1 : null,
			black: history[i + 1] ?? null,
		});
	}
	return rows;
});
</script>

<div class="match-page">
	{#if !embedded}
		<div class="match-header">
			<div class="match-title-row">
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
			<p class="match-players-subtitle">
					<a href="/players/{white?._id}" class="match-player with-icon">
						<PieceColor color="white" size={12} />
						<span>{white?.name ?? 'White'}</span>
						<span class="player-elo-delta" class:pos={whiteDelta > 0} class:neg={whiteDelta < 0}>
							{whiteElo.before}→{whiteElo.after}
							({whiteDelta >= 0 ? '+' : ''}{whiteDelta}{pending ? ' est.' : ''})
						</span>
					</a>
					<span class="match-vs">vs</span>
					<a href="/players/{black?._id}" class="match-player with-icon">
						<PieceColor color="black" size={12} />
						<span>{black?.name ?? 'Black'}</span>
						<span class="player-elo-delta" class:pos={blackDelta > 0} class:neg={blackDelta < 0}>
							{blackElo.before}→{blackElo.after}
							({blackDelta >= 0 ? '+' : ''}{blackDelta}{pending ? ' est.' : ''})
						</span>
					</a>
			</p>
		</div>
	{/if}

	<div class="match-layout" class:compact={embedded}>
		<div class="board-section">
			{#if pgnError}
				<p class="err">Could not parse PGN notation.</p>
			{/if}
			{#if fenError}
				<p class="err">Could not parse FEN string.</p>
			{/if}

			<div
				class="board-with-eval"
				class:with-eval={!embedded && replayActive && analysisAvailable}
			>
				<div class="board-wrap">
					<ChessBoard
						fen={boardDisplayFen}
						suggestion={embedded ? null : activeSuggestion}
						{hiddenSquares}
						{flyingPieces}
					/>
				</div>
				{#if !embedded && replayActive && analysisAvailable}
					<EvalBar
						eval={currentEval}
						loading={analysisLoading && currentEval == null}
					/>
				{/if}
			</div>

			{#if notationType === 'pgn' && history.length > 0}
				{#if !embedded}
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
				{/if}
			{:else if notationType === 'fen'}
				<p class="fen-note">Showing final board position from FEN.</p>
			{:else if notationType === 'none'}
				<p class="fen-note muted">No notation recorded for this match.</p>
			{/if}
		</div>

		{#if !embedded}
		<div class="match-info">
			<div class="result-banner">
				<span class="result-label {pending ? 'pending' : ''}">{pending ? 'Estimated result' : resultLabel}</span>
			</div>

			<div class="meta-card">
				<div class="meta-row">
					<span class="meta-label with-icon">
						<CalendarDays size={14} aria-hidden="true" />
						Date
					</span>
					<span>{new Date(match.playedAt).toLocaleString()}</span>
				</div>
				<div class="meta-row">
					<span class="meta-label with-icon">
						<FileCode2 size={14} aria-hidden="true" />
						Notation
					</span>
					<span class="notation-type">{notationType === 'none' ? 'None' : notationType.toUpperCase()}</span>
				</div>
				<div class="meta-row">
					<span class="meta-label with-icon">
						<Clock3 size={14} aria-hidden="true" />
						Time format
					</span>
					<span>{getTimeFormatLabel(match.timeFormat)}</span>
				</div>
				{#if notationType === 'pgn' && match.timeFormat && !hasMoveTimingData}
					<p class="meta-hint">This PGN does not include per-move time tags.</p>
				{/if}
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

			{#if notationType === 'pgn' && history.length > 0}
				<div class="replay-panel">
					<div class="controls controls-sidebar">
						<button type="button" onclick={goToStart} disabled={navTarget <= -1} title="Start (↑)" aria-label="Go to start">
							<ChevronFirst size={16} aria-hidden="true" />
						</button>
						<button type="button" onclick={stepBack} disabled={navTarget <= -1} title="Back (←)" aria-label="Previous move">
							<ChevronLeft size={16} aria-hidden="true" />
						</button>
						<span class="move-counter">
							{viewIndex === -1 ? 'Start' : `Move ${viewIndex + 1} / ${history.length}`}
						</span>
						<button type="button" onclick={stepForward} disabled={navTarget >= history.length - 1} title="Forward (→)" aria-label="Next move">
							<ChevronRight size={16} aria-hidden="true" />
						</button>
						<button type="button" onclick={goToEnd} disabled={navTarget >= history.length - 1} title="End (↓)" aria-label="Go to end">
							<ChevronLast size={16} aria-hidden="true" />
						</button>
					</div>
					<button
						type="button"
						class="suggestion-toggle suggestion-toggle-sidebar with-icon"
						class:active={showSuggestions}
						onclick={() => {
							showSuggestions = !showSuggestions;
						}}
						title={showSuggestions ? 'Hide suggested move' : 'Show suggested move'}
						aria-pressed={showSuggestions}
						aria-label={showSuggestions ? 'Hide suggested move' : 'Show suggested move'}
					>
						<Lightbulb size={15} aria-hidden="true" />
						<span class="suggestion-toggle-label">Toggle suggested move</span>
					</button>
					{#if currentClock}
						<div class="clock-strip clock-strip-sidebar">
							<div class="clock-item">
								<span class="clock-label with-icon">
									<PieceColor color="white" size={11} />
									White
								</span>
								<strong>{formatClockSeconds(currentClock.white)}</strong>
							</div>
							<div class="clock-item">
								<span class="clock-label with-icon">
									<PieceColor color="black" size={11} />
									Black
								</span>
								<strong>{formatClockSeconds(currentClock.black)}</strong>
							</div>
						</div>
					{/if}
					<div class="move-list move-list-sidebar">
						{#each moveRows as row}
							<div class="move-row">
								<span class="move-num">{row.number}.</span>
								<button
									type="button"
									id={moveAnchorId(row.whiteIndex)}
									class="move-btn"
									class:active={row.whiteIndex === viewIndex}
									onclick={() => goToMove(row.whiteIndex)}
								>
									<span>{row.white}</span>
									{#if moveElapsedByPly[row.whiteIndex] != null}
										<span class="move-time">({formatClockSeconds(moveElapsedByPly[row.whiteIndex] ?? 0)})</span>
									{/if}
								</button>
								{#if row.black}
									<button
										type="button"
										id={row.blackIndex != null ? moveAnchorId(row.blackIndex) : undefined}
										class="move-btn"
										class:active={row.blackIndex === viewIndex}
										onclick={() => row.blackIndex != null && goToMove(row.blackIndex)}
									>
										<span>{row.black}</span>
										{#if row.blackIndex != null && moveElapsedByPly[row.blackIndex] != null}
											<span class="move-time">({formatClockSeconds(moveElapsedByPly[row.blackIndex] ?? 0)})</span>
										{/if}
									</button>
								{:else}
									<span class="move-empty"></span>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}

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
		{/if}
	</div>
</div>

<style>
	.match-page { display: flex; flex-direction: column; gap: 1.25rem; }
	.match-header {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.match-title-row {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}
	.match-title-row h1 {
		margin: 0;
		font-size: 1.2rem;
		min-width: 0;
	}
	.match-players-subtitle {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.45rem 0.6rem;
		margin: 0;
		font-size: 0.9rem;
	}
	.match-player {
		font-weight: 500;
		color: var(--color-text-soft);
		text-decoration: none;
	}
	.match-player:hover { color: var(--color-link-hover); }
	.match-vs {
		color: var(--color-text-dim);
		font-size: 0.82rem;
	}
	.player-elo-delta {
		font-size: 0.78rem;
		color: var(--color-text-faint);
		font-weight: 500;
	}
	.player-elo-delta.pos { color: var(--color-success); }
	.player-elo-delta.neg { color: var(--color-error); }
	.back { color: var(--color-text-faint); text-decoration: none; font-size: 0.9rem; flex-shrink: 0; }
	.back:hover { color: var(--color-text-muted); }

	.match-layout {
		display: grid;
		grid-template-columns: 1fr 300px;
		gap: 2rem;
		align-items: start;
	}
	.match-layout.compact {
		grid-template-columns: minmax(0, min(480px, 100%));
		width: fit-content;
		max-width: 100%;
	}
	@media (max-width: 900px) {
		.match-layout { grid-template-columns: 1fr; }
	}

	@media (max-width: 640px) {
		.match-title-row h1 { font-size: 1.05rem; }
		.match-players-subtitle { font-size: 0.82rem; }
		.controls { flex-wrap: wrap; }
		.move-list-sidebar { max-height: 200px; }
	}

	.board-section { display: flex; flex-direction: column; gap: 0.75rem; }

	.board-with-eval {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		align-items: stretch;
		width: 100%;
		max-width: min(480px, 100%);
	}

	.board-with-eval.with-eval {
		grid-template-columns: minmax(0, 1fr) 2.75rem;
		gap: 0.5rem;
		max-width: min(600px, 100%);
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
		white-space: nowrap;
	}

	.suggestion-toggle.active {
		background: var(--color-border-strong);
		color: var(--color-text);
		border-color: var(--color-text-dim);
	}

	.suggestion-toggle:not(.active) {
		opacity: 0.65;
	}

	.move-counter { flex: 1; text-align: center; font-size: 0.82rem; color: var(--color-text-faint); min-width: 0; }

	.replay-panel {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.suggestion-toggle-sidebar {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		margin-left: 0;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		padding: 8px 12px;
		min-height: 32px;
		cursor: pointer;
		font-size: 0.85rem;
		color: var(--color-text-soft);
	}

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

	.move-list-sidebar {
		max-height: min(360px, 45vh);
		line-height: 1.4;
		padding: 8px 10px;
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
		display: inline-flex;
		align-items: baseline;
		gap: 4px;
	}
	.move-btn:hover { background: var(--color-match-move-bg); color: var(--color-link-hover); }
	.move-btn.active { background: var(--color-match-move-active-bg); color: var(--color-link-hover); font-weight: 600; }
	.move-time {
		font-size: 0.72rem;
		opacity: 0.8;
	}

	.move-row {
		display: grid;
		grid-template-columns: 2rem minmax(0, 1fr) minmax(0, 1fr);
		gap: 4px;
		align-items: center;
	}

	.move-row .move-num {
		font-size: 0.78rem;
		text-align: right;
		margin-right: 0;
	}

	.move-row .move-btn {
		width: 100%;
		margin-right: 0;
		justify-content: flex-start;
		padding: 4px 6px;
		min-width: 0;
	}

	.move-row .move-btn > span:first-child {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.move-empty {
		display: block;
	}

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
	.meta-hint {
		margin: 0;
		font-size: 0.78rem;
		color: var(--color-text-faint);
	}
	.clock-strip {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		padding: 8px 10px;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
	}
	.clock-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.82rem;
	}
	.clock-item strong {
		font-variant-numeric: tabular-nums;
	}
	.clock-label {
		color: var(--color-text-dim);
	}

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
