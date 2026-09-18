import {
	ANALYSIS_DEPTH_MAX,
	ANALYSIS_DEPTH_MIN,
	ANALYSIS_ENGINE_ID,
} from '$lib/stockfish/analysis-constants.js';

export {
	ANALYSIS_DEPTH_DEFAULT,
	ANALYSIS_DEPTH_MAX,
	ANALYSIS_DEPTH_MIN,
	ANALYSIS_ENGINE_ID,
} from '$lib/stockfish/analysis-constants.js';

/**
 * @param {unknown} value
 * @returns {value is { from: string, to: string }}
 */
const isBestMove = (value) =>
	!!value &&
	typeof value === 'object' &&
	typeof (/** @type {{ from?: unknown }} */ (value).from) === 'string' &&
	typeof (/** @type {{ to?: unknown }} */ (value).to) === 'string' &&
	/^[a-h][1-8]$/.test(/** @type {{ from: string }} */ (value).from) &&
	/^[a-h][1-8]$/.test(/** @type {{ to: string }} */ (value).to);

/**
 * @param {unknown} value
 * @returns {{ cp?: number, mate?: number, bestMove?: { from: string, to: string } | null } | null}
 */
const normalizePosition = (value) => {
	if (!value || typeof value !== 'object') return null;
	const raw = /** @type {{ cp?: unknown, mate?: unknown, bestMove?: unknown }} */ (value);
	/** @type {{ cp?: number, mate?: number, bestMove?: { from: string, to: string } | null }} */
	const point = {};

	if (typeof raw.mate === 'number' && Number.isFinite(raw.mate)) {
		point.mate = Math.trunc(raw.mate);
	} else if (typeof raw.cp === 'number' && Number.isFinite(raw.cp)) {
		point.cp = Math.trunc(raw.cp);
	} else {
		return null;
	}

	if (raw.bestMove === null) {
		point.bestMove = null;
	} else if (isBestMove(raw.bestMove)) {
		point.bestMove = {
			from: raw.bestMove.from.toLowerCase(),
			to: raw.bestMove.to.toLowerCase(),
		};
	}

	return point;
};

/**
 * @param {unknown} body
 * @param {{ expectedPlyCount?: number }} [options]
 * @returns {{ ok: true, analysis: import('mongodb').Document } | { ok: false, error: string }}
 */
export const parseAnalysisPayload = (body, options = {}) => {
	if (!body || typeof body !== 'object') {
		return { ok: false, error: 'Invalid analysis payload.' };
	}

	const raw = /** @type {{ depth?: unknown, positions?: unknown, engine?: unknown }} */ (body);
	const depth = Number(raw.depth);
	if (!Number.isInteger(depth) || depth < ANALYSIS_DEPTH_MIN || depth > ANALYSIS_DEPTH_MAX) {
		return {
			ok: false,
			error: `Depth must be an integer between ${ANALYSIS_DEPTH_MIN} and ${ANALYSIS_DEPTH_MAX}.`,
		};
	}

	if (!Array.isArray(raw.positions) || raw.positions.length === 0) {
		return { ok: false, error: 'Analysis positions are required.' };
	}

	if (
		typeof options.expectedPlyCount === 'number' &&
		raw.positions.length !== options.expectedPlyCount + 1
	) {
		return {
			ok: false,
			error: `Expected ${options.expectedPlyCount + 1} positions for this game.`,
		};
	}

	/** @type {{ cp?: number, mate?: number, bestMove?: { from: string, to: string } | null }[]} */
	const positions = [];
	for (const item of raw.positions) {
		const point = normalizePosition(item);
		if (!point) {
			return { ok: false, error: 'Each position needs a finite cp or mate score.' };
		}
		positions.push(point);
	}

	const engine =
		typeof raw.engine === 'string' && raw.engine.trim()
			? raw.engine.trim().slice(0, 64)
			: ANALYSIS_ENGINE_ID;

	return {
		ok: true,
		analysis: {
			depth,
			engine,
			analyzedAt: new Date(),
			positions,
		},
	};
};

/**
 * @param {unknown} analysis
 * @param {{ moveCount?: number }} [options]
 */
export const serializeStoredAnalysis = (analysis, options = {}) => {
	if (!analysis || typeof analysis !== 'object') return null;
	const raw =
		/** @type {{ depth?: unknown, engine?: unknown, analyzedAt?: unknown, positions?: unknown }} */ (
			analysis
		);
	if (!Array.isArray(raw.positions) || raw.positions.length === 0) return null;

	if (typeof options.moveCount === 'number' && raw.positions.length !== options.moveCount + 1) {
		return null;
	}

	const depth = Number(raw.depth);
	if (!Number.isInteger(depth) || depth < ANALYSIS_DEPTH_MIN || depth > ANALYSIS_DEPTH_MAX) {
		return null;
	}

	/** @type {{ cp?: number, mate?: number, bestMove?: { from: string, to: string } | null }[]} */
	const positions = [];
	for (const item of raw.positions) {
		const point = normalizePosition(item);
		if (!point) return null;
		positions.push(point);
	}

	const analyzedAt =
		raw.analyzedAt instanceof Date
			? raw.analyzedAt.toISOString()
			: typeof raw.analyzedAt === 'string'
				? raw.analyzedAt
				: null;

	return {
		depth,
		engine: typeof raw.engine === 'string' ? raw.engine : ANALYSIS_ENGINE_ID,
		analyzedAt,
		positions,
	};
};
