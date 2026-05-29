import { Chess } from 'chess.js';

/**
 * @typedef {{ from: string, to: string, promotion?: string }} BoardArrow
 * @typedef {{ from: string, to: string, piece: string }} SuggestionDisplay
 */

/** @param {string | null | undefined} uci */
export const parseUciMove = (uci) => {
	if (!uci || uci === '(none)') return null;
	const match = uci.match(/^([a-h][1-8])([a-h][1-8])([qrbn])?/i);
	if (!match) return null;
	return {
		from: match[1],
		to: match[2],
		...(match[3] ? { promotion: match[3].toLowerCase() } : {})
	};
};

/**
 * Arrow + ghost piece for the board overlay.
 * @param {string} fen
 * @param {BoardArrow | null | undefined} bestMove
 */
export const buildSuggestionDisplay = (fen, bestMove) => {
	if (!bestMove) return null;
	try {
		const chess = new Chess(fen);
		const moving = chess.get(/** @type {import('chess.js').Square} */ (bestMove.from));
		if (!moving) return null;
		const type = bestMove.promotion ?? moving.type;
		const piece = moving.color === 'w' ? type.toUpperCase() : type.toLowerCase();
		return { from: bestMove.from, to: bestMove.to, piece };
	} catch {
		return null;
	}
};

/** @param {string} square e.g. e4 */
export const squareToPercent = (square) => {
	const file = square.charCodeAt(0) - 'a'.charCodeAt(0);
	const rank = parseInt(square[1], 10);
	return {
		x: (file + 0.5) * 12.5,
		y: (8 - rank + 0.5) * 12.5
	};
};

/**
 * Line shortened so the arrow does not sit on square centers.
 * @param {{ x: number, y: number }} from
 * @param {{ x: number, y: number }} to
 * @param {number} [shrink]
 */
export const arrowLine = (from, to, shrink = 2.2) => {
	const dx = to.x - from.x;
	const dy = to.y - from.y;
	const len = Math.hypot(dx, dy);
	if (len < 0.01) {
		return { x1: from.x, y1: from.y, x2: to.x, y2: to.y };
	}
	const ux = dx / len;
	const uy = dy / len;
	return {
		x1: from.x + ux * shrink,
		y1: from.y + uy * shrink,
		x2: to.x - ux * shrink,
		y2: to.y - uy * shrink
	};
};

/** @param {SuggestionDisplay | null | undefined} suggestion */
export const suggestionArrowLabel = (suggestion) => {
	if (!suggestion) return '';
	return `Engine suggests ${suggestion.from} to ${suggestion.to} (not played)`;
};
