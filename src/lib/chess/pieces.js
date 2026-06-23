/** Lichess default piece set (Colin M.L. Burnett, GPLv2+). */
export const PIECE_SET = 'cburnett';

/**
 * URL for a FEN board character (K, q, etc.).
 * @param {string} fenChar
 */
export const pieceSvgUrl = (fenChar) => {
	const role = fenChar.toUpperCase();
	const color = fenChar === role ? 'w' : 'b';
	return `/pieces/${PIECE_SET}/${color}${role}.svg`;
};
