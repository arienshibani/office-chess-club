import { Chess } from 'chess.js';

export const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

/** @param {string[]} history SAN move list */
export const buildFenTimeline = (history, initialFen = INITIAL_FEN) => {
	const fens = [initialFen];
	const chess = new Chess();
	for (const move of history) {
		chess.move(move);
		fens.push(chess.fen());
	}
	return fens;
};

/** @param {string[]} history @param {number} viewIndex -1 = start */
export const fenAtMoveIndex = (history, viewIndex, initialFen = INITIAL_FEN) => {
	if (viewIndex < 0) return initialFen;
	const chess = new Chess();
	for (let i = 0; i <= viewIndex && i < history.length; i++) {
		chess.move(history[i]);
	}
	return chess.fen();
};
