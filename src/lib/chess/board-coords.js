/** @param {string} square e.g. "e4" */
export const squareToGrid = (square) => {
	const file = square.charCodeAt(0) - 'a'.charCodeAt(0);
	const rank = Number.parseInt(square[1], 10);
	return { file, rankIdx: 8 - rank };
};

/** @param {string} square e.g. "e4" */
export const squareToPercent = (square) => {
	const { file, rankIdx } = squareToGrid(square);
	return {
		left: ((file + 0.5) / 8) * 100,
		top: ((rankIdx + 0.5) / 8) * 100,
	};
};

/** @param {string} from @param {string} to @param {number} boardPx */
export const slideDeltaPx = (from, to, boardPx) => {
	const square = boardPx / 8;
	const a = squareToGrid(from);
	const b = squareToGrid(to);
	return {
		x: (b.file - a.file) * square,
		y: (b.rankIdx - a.rankIdx) * square,
	};
};
