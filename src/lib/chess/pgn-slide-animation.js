import { tick } from 'svelte';
import { fenAtMoveIndex } from '$lib/chess/pgn-replay.js';

export const MOVE_ANIM_MS = 80;
const SNAP_GAP = 5;

/** @param {number} gap */
const durationForGap = (gap) => {
	if (gap >= 4) return 70;
	if (gap >= 3) return 110;
	if (gap >= 2) return 170;
	return MOVE_ANIM_MS;
};

/** @param {{ piece: string, color: string, promotion?: string }} move */
export const pieceCharFromMove = (move) => {
	const role = move.promotion ?? move.piece;
	return move.color === 'w' ? role.toUpperCase() : role;
};

/** @param {string} flags */
export const isCastle = (flags) => flags.includes('k') || flags.includes('q');

/** @param {{ flags: string, color: string }} move */
export const castleRookFlight = (move) => {
	const white = move.color === 'w';
	if (move.flags.includes('k')) {
		return {
			from: white ? 'h1' : 'h8',
			to: white ? 'f1' : 'f8',
			piece: white ? 'R' : 'r',
		};
	}
	if (move.flags.includes('q')) {
		return {
			from: white ? 'a1' : 'a8',
			to: white ? 'd1' : 'd8',
			piece: white ? 'R' : 'r',
		};
	}
	return null;
};

export const waitForPaint = async () => {
	await tick();
	await new Promise((resolve) => requestAnimationFrame(resolve));
	await new Promise((resolve) => requestAnimationFrame(resolve));
};

/** @param {{ piece: string, from: string, to: string }[]} flights */
export const withFlightIds = (flights) =>
	flights.map((flight, index) => ({
		...flight,
		id: `${flight.from}-${flight.to}-${flight.piece}-${index}`,
	}));

/** @param {import('chess.js').Move} move */
export const buildSlideForMove = (move) => {
	const rookFlight = isCastle(move.flags) ? castleRookFlight(move) : null;
	const flights = rookFlight
		? [
				{ piece: pieceCharFromMove(move), from: move.from, to: move.to },
				{ piece: rookFlight.piece, from: rookFlight.from, to: rookFlight.to },
			]
		: [{ piece: pieceCharFromMove(move), from: move.from, to: move.to }];

	const hiddenSquares = rookFlight
		? [move.from, rookFlight.from]
		: move.captured
			? [move.from, move.to]
			: [move.from];

	return { flights, hiddenSquares };
};

/** @param {import('chess.js').Move} move */
export const buildReverseSlideForMove = (move) => {
	const rookFlight = isCastle(move.flags) ? castleRookFlight(move) : null;
	const flights = rookFlight
		? [
				{ piece: pieceCharFromMove(move), from: move.to, to: move.from },
				{ piece: rookFlight.piece, from: rookFlight.to, to: rookFlight.from },
			]
		: [{ piece: pieceCharFromMove(move), from: move.to, to: move.from }];

	const hiddenSquares = rookFlight ? [move.to, rookFlight.to] : [move.to];

	return { flights, hiddenSquares };
};

/**
 * @param {(pieces: { piece: string, from: string, to: string, active?: boolean, id?: string }[]) => void} setFlyingPieces
 * @param {{ piece: string, from: string, to: string }[]} flights
 * @param {number} [durationMs]
 */
export const runSlideAnimation = async (setFlyingPieces, flights, durationMs = MOVE_ANIM_MS) => {
	const tracked = withFlightIds(flights);
	setFlyingPieces(tracked.map((flight) => ({ ...flight, active: false })));
	await waitForPaint();
	setFlyingPieces(tracked.map((flight) => ({ ...flight, active: true })));
	await new Promise((resolve) => setTimeout(resolve, durationMs + 40));
};

/**
 * @param {object} p
 * @param {number} p.index
 * @param {string[]} p.sanHistory
 * @param {(index: number) => void} p.setViewIndex
 * @param {(fen: string) => void} p.setBoardFen
 * @param {(squares: string[]) => void} p.setHiddenSquares
 * @param {(pieces: { piece: string, from: string, to: string, active?: boolean, id?: string }[]) => void} p.setFlyingPieces
 * @param {(animating: boolean) => void} p.setIsAnimating
 */
export const snapBoardToIndex = ({
	index,
	sanHistory,
	setViewIndex,
	setBoardFen,
	setHiddenSquares,
	setFlyingPieces,
	setIsAnimating,
}) => {
	setViewIndex(index);
	setBoardFen(fenAtMoveIndex(sanHistory, index));
	setHiddenSquares([]);
	setFlyingPieces([]);
	setIsAnimating(false);
};

/**
 * @param {object} p
 * @param {number} p.nextIndex
 * @param {number} p.viewIndex
 * @param {number} p.durationMs
 * @param {string[]} p.sanHistory
 * @param {import('chess.js').Move[]} p.verboseMoves
 * @param {(index: number) => void} p.setViewIndex
 * @param {(fen: string) => void} p.setBoardFen
 * @param {(squares: string[]) => void} p.setHiddenSquares
 * @param {(pieces: { piece: string, from: string, to: string, active?: boolean, id?: string }[]) => void} p.setFlyingPieces
 */
const playBoardStep = async ({
	nextIndex,
	viewIndex,
	durationMs,
	sanHistory,
	verboseMoves,
	setViewIndex,
	setBoardFen,
	setHiddenSquares,
	setFlyingPieces,
}) => {
	if (nextIndex === viewIndex - 1) {
		const move = verboseMoves[viewIndex];
		if (!move) {
			setViewIndex(nextIndex);
			setBoardFen(fenAtMoveIndex(sanHistory, nextIndex));
			setHiddenSquares([]);
			setFlyingPieces([]);
			return;
		}

		setBoardFen(fenAtMoveIndex(sanHistory, viewIndex));
		const { flights, hiddenSquares } = buildReverseSlideForMove(move);
		setHiddenSquares(hiddenSquares);
		await runSlideAnimation(setFlyingPieces, flights, durationMs);
		setViewIndex(nextIndex);
		setBoardFen(fenAtMoveIndex(sanHistory, nextIndex));
		setHiddenSquares([]);
		setFlyingPieces([]);
		return;
	}

	if (nextIndex === viewIndex + 1) {
		const move = verboseMoves[nextIndex];
		if (!move) {
			setViewIndex(nextIndex);
			setBoardFen(fenAtMoveIndex(sanHistory, nextIndex));
			setHiddenSquares([]);
			setFlyingPieces([]);
			return;
		}

		setBoardFen(fenAtMoveIndex(sanHistory, nextIndex - 1));
		const { flights, hiddenSquares } = buildSlideForMove(move);
		setHiddenSquares(hiddenSquares);
		await runSlideAnimation(setFlyingPieces, flights, durationMs);
		setViewIndex(nextIndex);
		setBoardFen(fenAtMoveIndex(sanHistory, nextIndex));
		setHiddenSquares([]);
		setFlyingPieces([]);
	}
};

/**
 * Queues navigation toward a target ply. Rapid input coalesces into one path,
 * speeds up when multiple moves are pending, and snaps on large jumps.
 *
 * @param {object} options
 * @param {() => string[]} options.getSanHistory
 * @param {() => import('chess.js').Move[]} options.getVerboseMoves
 * @param {() => number} options.getViewIndex
 * @param {(index: number) => void} options.setViewIndex
 * @param {(fen: string) => void} options.setBoardFen
 * @param {(squares: string[]) => void} options.setHiddenSquares
 * @param {(pieces: { piece: string, from: string, to: string, active?: boolean, id?: string }[]) => void} options.setFlyingPieces
 * @param {(animating: boolean) => void} options.setIsAnimating
 */
export const createSlideReplayDriver = ({
	getSanHistory,
	getVerboseMoves,
	getViewIndex,
	setViewIndex,
	setBoardFen,
	setHiddenSquares,
	setFlyingPieces,
	setIsAnimating,
}) => {
	let targetIndex = getViewIndex();
	let draining = false;
	let generation = 0;

	const boardCallbacks = () => ({
		setViewIndex,
		setBoardFen,
		setHiddenSquares,
		setFlyingPieces,
		setIsAnimating,
	});

	const clampIndex = (/** @type {number} */ index) => {
		const max = getSanHistory().length - 1;
		return Math.max(-1, Math.min(index, max));
	};

	const resetVisualToCommitted = () => {
		const index = getViewIndex();
		setBoardFen(fenAtMoveIndex(getSanHistory(), index));
		setHiddenSquares([]);
		setFlyingPieces([]);
	};

	const drain = async () => {
		if (draining) return;
		draining = true;
		setIsAnimating(true);

		try {
			while (targetIndex !== getViewIndex()) {
				const gen = generation;
				const view = getViewIndex();
				const gap = Math.abs(targetIndex - view);

				if (gap >= SNAP_GAP) {
					snapBoardToIndex({
						index: targetIndex,
						sanHistory: getSanHistory(),
						...boardCallbacks(),
					});
					break;
				}

				const nextIndex = view < targetIndex ? view + 1 : view - 1;

				await playBoardStep({
					nextIndex,
					viewIndex: view,
					durationMs: durationForGap(gap),
					sanHistory: getSanHistory(),
					verboseMoves: getVerboseMoves(),
					...boardCallbacks(),
				});

				if (gen !== generation) {
					resetVisualToCommitted();
				}
			}
		} finally {
			draining = false;
			if (targetIndex === getViewIndex()) {
				setIsAnimating(false);
			} else {
				void drain();
			}
		}
	};

	const requestIndex = (/** @type {number} */ index) => {
		targetIndex = clampIndex(index);
		generation += 1;
		void drain();
	};

	const snapToIndex = (/** @type {number} */ index) => {
		generation += 1;
		targetIndex = clampIndex(index);
		snapBoardToIndex({
			index: targetIndex,
			sanHistory: getSanHistory(),
			...boardCallbacks(),
		});
	};

	return {
		requestIndex,
		stepForward: () => requestIndex(targetIndex + 1),
		stepBack: () => requestIndex(targetIndex - 1),
		snapToIndex,
		getTargetIndex: () => targetIndex,
		isBusy: () => draining || targetIndex !== getViewIndex(),
		canStepForward: () => targetIndex < getSanHistory().length - 1,
		canStepBack: () => targetIndex > -1,
	};
};
