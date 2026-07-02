/**
 * Parse a URL hash fragment into a ply view index (-1 = start).
 * Accepts #8w, #8b, #m8w, #start, #0.
 *
 * @param {string} hash
 * @returns {number | null}
 */
export const parseMoveHash = (hash) => {
	const h = hash.replace(/^#/, '').trim().toLowerCase();
	if (!h) return null;
	if (h === 'start' || h === '0') return -1;
	const m = /^(?:m)?(\d+)([wb])$/.exec(h);
	if (!m) return null;
	const moveNumber = Number(m[1]);
	if (!Number.isInteger(moveNumber) || moveNumber < 1) return null;
	return (moveNumber - 1) * 2 + (m[2] === 'b' ? 1 : 0);
};

/**
 * @param {number} viewIndex
 * @returns {string} hash fragment without leading # (e.g. "8w", "start")
 */
export const formatMoveHash = (viewIndex) => {
	if (viewIndex < 0) return 'start';
	const moveNumber = Math.floor(viewIndex / 2) + 1;
	const color = viewIndex % 2 === 0 ? 'w' : 'b';
	return `${moveNumber}${color}`;
};

/** @param {number} viewIndex */
export const moveAnchorId = (viewIndex) => `m${formatMoveHash(viewIndex)}`;

/**
 * @param {number | null} index
 * @param {number} moveCount
 * @returns {number | null}
 */
export const clampMoveIndex = (index, moveCount) => {
	if (index == null || index < -1 || index >= moveCount) return null;
	return index;
};
