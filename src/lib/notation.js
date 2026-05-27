import { Chess } from 'chess.js';

/** @param {string | null | undefined} n */
export const detectNotationType = (n) => {
	if (!n) return 'none';
	if (/^[rnbqkpRNBQKP1-8/]+ [wb] [KQkq-]+ [a-h3-6-]+ \d+ \d+$/.test(n.trim())) return 'fen';
	return 'pgn';
};

/** @param {string} raw */
export const validateNotation = (raw) => {
	const trimmed = raw.trim();
	if (!trimmed) return { ok: true, notation: null };

	if (detectNotationType(trimmed) === 'fen') {
		try {
			const chess = new Chess();
			chess.load(trimmed);
			return { ok: true, notation: trimmed };
		} catch {
			return { ok: false, error: 'Invalid FEN string.' };
		}
	}

	try {
		const chess = new Chess();
		chess.loadPgn(trimmed);
		return { ok: true, notation: trimmed };
	} catch {
		return { ok: false, error: 'Invalid PGN.' };
	}
};
