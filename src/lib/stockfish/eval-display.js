/** @typedef {{ cp?: number, mate?: number }} EvalPoint */

const CP_CLAMP = 1000;

/**
 * UCI scores are from side-to-move; convert to white's perspective.
 * @param {string} fen
 * @param {{ cp?: number, mate?: number }} raw
 */
export const normalizeEvalForWhite = (fen, raw) => {
	const stm = fen.split(' ')[1];
	const flip = stm === 'b';
	if (raw.mate !== undefined) {
		const mate = flip ? -raw.mate : raw.mate;
		return { mate };
	}
	const cp = raw.cp ?? 0;
	return { cp: flip ? -cp : cp };
};

/** @param {EvalPoint | null | undefined} evalPoint */
export const evalToWhitePercent = (evalPoint) => {
	if (!evalPoint) return 50;
	if (evalPoint.mate !== undefined) {
		if (evalPoint.mate > 0) return 100;
		if (evalPoint.mate < 0) return 0;
		return 50;
	}
	const cp = Math.max(-CP_CLAMP, Math.min(CP_CLAMP, evalPoint.cp ?? 0));
	const winProb = 1 / (1 + 10 ** (-cp / 400));
	return winProb * 100;
};

/** @param {EvalPoint | null | undefined} evalPoint */
export const formatEvalLabel = (evalPoint) => {
	if (!evalPoint) return '';
	if (evalPoint.mate !== undefined) {
		return evalPoint.mate > 0 ? `#${evalPoint.mate}` : `#${evalPoint.mate}`;
	}
	const pawns = (evalPoint.cp ?? 0) / 100;
	return pawns >= 0 ? `+${pawns.toFixed(1)}` : pawns.toFixed(1);
};

/** @param {EvalPoint | null | undefined} evalPoint */
export const evalAriaLabel = (evalPoint) => {
	if (!evalPoint) return 'Engine evaluation unavailable';
	if (evalPoint.mate !== undefined) {
		return evalPoint.mate > 0
			? `White is winning, mate in ${evalPoint.mate}`
			: `Black is winning, mate in ${Math.abs(evalPoint.mate)}`;
	}
	const pawns = ((evalPoint.cp ?? 0) / 100).toFixed(1);
	if ((evalPoint.cp ?? 0) > 50) return `White is better by ${pawns} pawns`;
	if ((evalPoint.cp ?? 0) < -50) return `Black is better by ${Math.abs(Number(pawns))} pawns`;
	return 'Roughly equal position';
};
