<script>
	import { onMount } from "svelte";
	import { browser } from "$app/environment";
	import { ChevronLeft, ChevronRight } from "@lucide/svelte";
	import { Chess } from "chess.js";
	import ChessBoard from "$lib/components/board/ChessBoard.svelte";
import { createSlideReplayDriver } from "$lib/chess/pgn-slide-animation.js";
	import { INITIAL_FEN } from "$lib/chess/pgn-replay.js";
	import PieceColor from "$lib/components/player/PieceColor.svelte";

	const AUTO_PAUSE_MS = 3000;
	const LOOP_PAUSE_MS = 3500;
	const START_PAUSE_MS = 3000;

	let {
		match,
		white = null,
		black = null,
	} = $props();

	const matchUrl = $derived(`/matches/${match._id}`);

	const replay = $derived.by(() => {
		const notation = match.notation ?? "";
		try {
			const chess = new Chess();
			chess.loadPgn(notation);
			return {
				sanHistory: chess.history(),
				verboseMoves: chess.history({ verbose: true }),
			};
		} catch {
			return { sanHistory: [], verboseMoves: [] };
		}
	});

	let viewIndex = $state(-1);
	let boardFen = $state(INITIAL_FEN);
	let hiddenSquares = $state(/** @type {string[]} */ ([]));
	let flyingPieces = $state(
		/** @type {{ piece: string, from: string, to: string, active?: boolean, id?: string }[]} */ ([]),
	);
	let isAnimating = $state(false);
	let navTarget = $state(-1);
	let autoplayEnabled = $state(true);
	/** @type {ReturnType<typeof setTimeout> | null} */
	let autoplayTimer = null;

	const replayDriver = createSlideReplayDriver({
		getSanHistory: () => replay.sanHistory,
		getVerboseMoves: () => replay.verboseMoves,
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

	const clearAutoplayTimer = () => {
		if (autoplayTimer) {
			clearTimeout(autoplayTimer);
			autoplayTimer = null;
		}
	};

	const scheduleAutoplay = () => {
		clearAutoplayTimer();
		if (!browser || !autoplayEnabled) return;
		if (!replay.sanHistory.length) return;

		if (replayDriver.isBusy()) {
			autoplayTimer = setTimeout(() => scheduleAutoplay(), 60);
			return;
		}

		const delay =
			viewIndex === -1
				? START_PAUSE_MS
				: viewIndex >= replay.sanHistory.length - 1
					? LOOP_PAUSE_MS
					: AUTO_PAUSE_MS;

		autoplayTimer = setTimeout(() => {
			if (!autoplayEnabled) return;

			if (viewIndex >= replay.sanHistory.length - 1) {
				snapToIndex(-1);
			} else {
				replayDriver.stepForward();
				syncNav();
			}

			scheduleAutoplay();
		}, delay);
	};

	$effect(() => {
		void `${match._id}:${match.notation ?? ""}`;
		snapToIndex(-1);
		autoplayEnabled = true;
	});

	$effect(() => {
		viewIndex;
		isAnimating;
		autoplayEnabled;
		scheduleAutoplay();
	});

	onMount(() => () => clearAutoplayTimer());

	const pauseAutoplay = () => {
		autoplayEnabled = false;
		clearAutoplayTimer();
	};

	const stepBack = () => {
		pauseAutoplay();
		replayDriver.stepBack();
		syncNav();
	};

	const stepForward = () => {
		pauseAutoplay();
		replayDriver.stepForward();
		syncNav();
	};

	const moveLabel = $derived(
		viewIndex === -1
			? "Start"
			: `Move ${viewIndex + 1} / ${replay.sanHistory.length}`,
	);
</script>

<div class="featured-showcase">
	<header class="featured-header">
		<div class="featured-title-block">
			<a href={matchUrl} class="featured-title-link">
				<h2>Featured Match</h2>
			</a>
			<p class="featured-players">
				<a href={matchUrl} class="featured-player with-icon">
					<PieceColor color="white" size={12} />
					{white?.name ?? "White"}
				</a>
				<span class="featured-vs">vs</span>
				<a href={matchUrl} class="featured-player with-icon">
					<PieceColor color="black" size={12} />
					{black?.name ?? "Black"}
				</a>
			</p>
		</div>
	</header>

	<div class="board-column">
		<a href={matchUrl} class="board-hit-area" aria-label="Open full match review">
			<ChessBoard fen={boardFen} {hiddenSquares} {flyingPieces} />
		</a>

		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="board-controls"
			role="group"
			aria-label="Replay controls"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<button
				type="button"
				class="nav-btn"
				onclick={stepBack}
				disabled={navTarget <= -1}
				title="Previous move"
				aria-label="Previous move"
			>
				<ChevronLeft size={16} aria-hidden="true" />
			</button>
			<span class="move-counter">{moveLabel}</span>
			<button
				type="button"
				class="nav-btn"
				onclick={stepForward}
				disabled={navTarget >= replay.sanHistory.length - 1}
				title="Next move"
				aria-label="Next move"
			>
				<ChevronRight size={16} aria-hidden="true" />
			</button>
		</div>
	</div>
</div>

<style>
	.featured-showcase {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.featured-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
	}

	.featured-title-block {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.featured-title-link {
		text-decoration: none;
		color: inherit;
	}

	.featured-title-link:hover h2 {
		color: var(--color-link-hover);
	}

	.featured-title-block h2 {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--color-heading);
		transition: color 0.15s;
	}

	.featured-players {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.45rem 0.6rem;
		margin: 0;
		font-size: 0.9rem;
	}

	.featured-player {
		font-weight: 500;
		color: var(--color-text-soft);
		text-decoration: none;
	}

	.featured-player:hover {
		color: var(--color-link-hover);
	}

	.featured-vs {
		color: var(--color-text-dim);
		font-size: 0.82rem;
	}

	.board-column {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		width: fit-content;
		max-width: 100%;
	}

	.board-hit-area {
		display: block;
		width: 100%;
		text-decoration: none;
		border-radius: 6px;
		transition: opacity 0.15s;
	}

	.board-hit-area:hover {
		opacity: 0.92;
	}

	.board-controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		padding: 8px 12px;
		width: fit-content;
		max-width: 100%;
	}

	.nav-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: var(--color-surface-muted);
		border: 1px solid var(--color-border-strong);
		color: var(--color-text-soft);
		border-radius: 4px;
		padding: 4px 10px;
		cursor: pointer;
		min-width: 36px;
		min-height: 32px;
	}

	.nav-btn:hover:not(:disabled) {
		background: var(--color-border-strong);
	}

	.nav-btn:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	.move-counter {
		flex: 1;
		text-align: center;
		font-size: 0.82rem;
		color: var(--color-text-faint);
		min-width: 7rem;
	}
</style>
