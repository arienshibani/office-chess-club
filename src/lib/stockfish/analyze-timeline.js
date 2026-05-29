import { buildFenTimeline } from '$lib/pgn-replay.js';
import { analyzePosition, warmUpEngine } from './engine.js';

export { buildFenTimeline };

/**
 * @typedef {{ cp?: number, mate?: number, bestMove?: { from: string, to: string } | null }} EvalPoint
 */

/**
 * @param {string[]} fens
 * @param {{ depth?: number, signal?: AbortSignal, onProgress?: (point: EvalPoint, index: number, total: number) => void }} [options]
 * @returns {Promise<EvalPoint[]>}
 */
export const analyzeFens = async (fens, options = {}) => {
	const { depth, signal, onProgress } = options;
	await warmUpEngine();

	/** @type {EvalPoint[]} */
	const results = [];
	for (let i = 0; i < fens.length; i++) {
		if (signal?.aborted) {
			throw new DOMException('Aborted', 'AbortError');
		}
		const point = await analyzePosition(fens[i], { depth, signal });
		results.push(point);
		onProgress?.(point, i, fens.length);
	}
	return results;
};

/**
 * @param {string[]} history SAN moves
 * @param {{ depth?: number, signal?: AbortSignal, onProgress?: (done: number, total: number) => void }} [options]
 */
export const analyzeHistory = async (history, options = {}) => {
	const fens = buildFenTimeline(history);
	return analyzeFens(fens, options);
};
