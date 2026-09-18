/** @typedef {{ cp?: number, mate?: number }} EvalPoint */

/** Centipawn loss at or above this marks a blunder. */
export const BLUNDER_CP_THRESHOLD = 200;

const MATE_SCORE = 10_000;

/**
 * Convert an eval (white's perspective) to a comparable centipawn-like score.
 * Mates map to large magnitudes so swings register as blunders.
 * @param {EvalPoint | null | undefined} point
 * @returns {number | null}
 */
export const evalToComparableCp = (point) => {
	if (!point || typeof point !== 'object') return null;
	if (typeof point.mate === 'number' && Number.isFinite(point.mate)) {
		const m = point.mate;
		if (m === 0) return 0;
		return Math.sign(m) * (MATE_SCORE - Math.abs(m));
	}
	if (typeof point.cp === 'number' && Number.isFinite(point.cp)) return point.cp;
	return null;
};

/**
 * Centipawn loss for the side that just moved (higher = worse).
 * @param {EvalPoint | null | undefined} before
 * @param {EvalPoint | null | undefined} after
 * @param {boolean} whiteMoved
 */
export const centipawnLossForMover = (before, after, whiteMoved) => {
	const beforeCp = evalToComparableCp(before);
	const afterCp = evalToComparableCp(after);
	if (beforeCp == null || afterCp == null) return null;
	return whiteMoved ? beforeCp - afterCp : afterCp - beforeCp;
};

/**
 * Ply indices (0-based SAN history indices) that are blunders.
 * `evals[0]` is the starting position; `evals[i + 1]` is after move `i`.
 *
 * @param {(EvalPoint | null | undefined)[]} evals
 * @param {{ threshold?: number }} [options]
 * @returns {Set<number>}
 */
export const findBlunderPlyIndices = (evals, options = {}) => {
	const threshold = options.threshold ?? BLUNDER_CP_THRESHOLD;
	/** @type {Set<number>} */
	const blunders = new Set();
	if (!Array.isArray(evals) || evals.length < 2) return blunders;

	for (let ply = 0; ply < evals.length - 1; ply++) {
		const whiteMoved = ply % 2 === 0;
		const loss = centipawnLossForMover(evals[ply], evals[ply + 1], whiteMoved);
		if (loss != null && loss >= threshold) blunders.add(ply);
	}
	return blunders;
};
