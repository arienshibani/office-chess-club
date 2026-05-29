import { browser } from '$app/environment';
import { parseUciMove } from '$lib/chess-arrows.js';
import { normalizeEvalForWhite } from './eval-display.js';

const STOCKFISH_URL = '/stockfish.js';
const DEFAULT_DEPTH = 14;

/** @type {Worker | null} */
let worker = null;
/** @type {Promise<void> | null} */
let readyPromise = null;
/** @type {Promise<unknown> | null} */
let searchChain = Promise.resolve();

/**
 * @param {string} line
 * @param {(line: string) => void} onLine
 */
const drainLines = (line, onLine) => {
	const parts = String(line).split('\n');
	for (const part of parts) {
		const trimmed = part.trim();
		if (trimmed) onLine(trimmed);
	}
};

const ensureWorker = () => {
	if (!browser) {
		throw new Error('Stockfish is only available in the browser');
	}
	if (worker) return worker;
	worker = new Worker(STOCKFISH_URL);
	return worker;
};

const ensureReady = () => {
	if (readyPromise) return readyPromise;

	readyPromise = new Promise((resolve, reject) => {
		const w = ensureWorker();
		let sawUciOk = false;
		let settled = false;

		/** @param {MessageEvent} event */
		const onMessage = (event) => {
			drainLines(event.data, (line) => {
				if (line === 'uciok') sawUciOk = true;
				if (line === 'readyok' && sawUciOk && !settled) {
					settled = true;
					w.removeEventListener('message', onMessage);
					resolve();
				}
			});
		};

		w.addEventListener('message', onMessage);
		w.postMessage('uci');
		w.postMessage('isready');

		setTimeout(() => {
			if (!settled) {
				settled = true;
				w.removeEventListener('message', onMessage);
				reject(new Error('Stockfish failed to initialize'));
			}
		}, 20000);
	});

	return readyPromise;
};

/**
 * @typedef {{ cp?: number, mate?: number, bestMove?: { from: string, to: string } | null }} AnalysisResult
 */

/**
 * @param {string} fen
 * @param {{ depth?: number, signal?: AbortSignal }} [options]
 * @returns {Promise<AnalysisResult>}
 */
export const analyzePosition = (fen, options = {}) => {
	const depth = options.depth ?? DEFAULT_DEPTH;
	const signal = options.signal;

	const run = () =>
		new Promise((resolve, reject) => {
			if (signal?.aborted) {
				reject(new DOMException('Aborted', 'AbortError'));
				return;
			}

			const w = ensureWorker();
			/** @type {{ cp?: number, mate?: number }} */
			let lastRaw = { cp: 0 };

			/** @param {MessageEvent} event */
			const onMessage = (event) => {
				drainLines(event.data, (line) => {
					if (line.startsWith('info ')) {
						const mateMatch = line.match(/\bscore mate (-?\d+)/);
						const cpMatch = line.match(/\bscore cp (-?\d+)/);
						if (mateMatch) {
							lastRaw = { mate: parseInt(mateMatch[1], 10) };
						} else if (cpMatch) {
							lastRaw = { cp: parseInt(cpMatch[1], 10) };
						}
					}
					if (line.startsWith('bestmove')) {
						w.removeEventListener('message', onMessage);
						signal?.removeEventListener('abort', onAbort);
						const uci = line.split(/\s+/)[1] ?? '';
						resolve({
							...normalizeEvalForWhite(fen, lastRaw),
							bestMove: parseUciMove(uci)
						});
					}
				});
			};

			const onAbort = () => {
				w.postMessage('stop');
				w.removeEventListener('message', onMessage);
				reject(new DOMException('Aborted', 'AbortError'));
			};

			w.addEventListener('message', onMessage);
			signal?.addEventListener('abort', onAbort, { once: true });

			w.postMessage(`position fen ${fen}`);
			w.postMessage(`go depth ${depth}`);
		});

	return (searchChain = searchChain.then(run, run));
};

/** Stop current search and reset queue (e.g. on navigation). */
export const stopEngine = () => {
	if (worker) {
		worker.postMessage('stop');
	}
	searchChain = Promise.resolve();
};

/** @returns {Promise<void>} */
export const warmUpEngine = () => ensureReady();
