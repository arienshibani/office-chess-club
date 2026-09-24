import { Chess } from 'chess.js';

/** @param {string | null | undefined} n */
export const detectNotationType = (n) => {
	if (!n) return 'none';
	if (/^[rnbqkpRNBQKP1-8/]+ [wb] [KQkq-]+ [a-h3-6-]+ \d+ \d+$/.test(n.trim())) return 'fen';
	return 'pgn';
};

/**
 * @typedef {{
 *   kind: 'illegal-move',
 *   move: string,
 *   moveNumber: number,
 *   side: 'white' | 'black',
 *   label: string,
 *   inCheck: boolean,
 *   legalMoves: string[],
 *   context: string,
 * }} IllegalMoveError
 * @typedef {{
 *   kind: 'syntax',
 *   line: number,
 *   column: number,
 *   snippet: string,
 *   found: string | null,
 * }} SyntaxErrorDetail
 * @typedef {{ kind: 'fen', message: string }} FenErrorDetail
 * @typedef {IllegalMoveError | SyntaxErrorDetail | FenErrorDetail} NotationErrorDetail
 * @typedef {{ ok: true, notation: string | null } | { ok: false, error: string, notationError?: NotationErrorDetail }} NotationValidation
 */

const RESULT_TOKEN = /^(?:1-0|0-1|1\/2-1\/2|\*)$/;
const NAG_TOKEN = /^\$\d+$/;
const MOVE_NUMBER_ONLY = /^\d+\.+$/;
const NUMBERED_MOVE = /^\d+\.+(.+)$/;

/** @param {string} pgn */
const extractMainlineSans = (pgn) => {
	const text = pgn.replace(/\[[^\]\r\n]*\]/g, ' ');
	/** @type {string[]} */
	const moves = [];
	let i = 0;
	while (i < text.length) {
		const ch = text[i];
		if (ch === '{') {
			const end = text.indexOf('}', i + 1);
			i = end === -1 ? text.length : end + 1;
			continue;
		}
		if (ch === ';') {
			const end = text.indexOf('\n', i + 1);
			i = end === -1 ? text.length : end + 1;
			continue;
		}
		if (ch === '(') {
			let depth = 1;
			i += 1;
			while (i < text.length && depth > 0) {
				if (text[i] === '{') {
					const end = text.indexOf('}', i + 1);
					i = end === -1 ? text.length : end + 1;
					continue;
				}
				if (text[i] === '(') depth += 1;
				else if (text[i] === ')') depth -= 1;
				i += 1;
			}
			continue;
		}
		if (/\s/.test(ch)) {
			i += 1;
			continue;
		}
		let j = i;
		while (j < text.length && !/[\s{}()]/.test(text[j])) j += 1;
		const token = text.slice(i, j);
		i = j;
		if (
			!token ||
			RESULT_TOKEN.test(token) ||
			NAG_TOKEN.test(token) ||
			MOVE_NUMBER_ONLY.test(token)
		) {
			continue;
		}
		const numbered = NUMBERED_MOVE.exec(token);
		moves.push(numbered ? numbered[1] : token);
	}
	return moves;
};

/** @param {string} pgn */
const fenHeader = (pgn) => {
	const match = /\[\s*FEN\s+"([^"]*)"\s*\]/i.exec(pgn);
	return match?.[1] ?? null;
};

/** @param {string} move */
const bareSan = (move) => move.replace(/[+#?!]/g, '');

/**
 * @param {string} pgn
 * @param {string} reportedMove
 * @returns {IllegalMoveError | null}
 */
const diagnoseIllegalMove = (pgn, reportedMove) => {
	const chess = new Chess();
	const fen = fenHeader(pgn);
	if (fen) {
		try {
			chess.load(fen);
		} catch {
			return null;
		}
	}

	const played = [];
	for (const san of extractMainlineSans(pgn)) {
		const moveNumber = chess.moveNumber();
		const side = chess.turn() === 'w' ? 'white' : 'black';
		const label = side === 'white' ? `${moveNumber}. ${san}` : `${moveNumber}... ${san}`;
		try {
			chess.move(san);
			played.push(label);
		} catch {
			if (bareSan(san) !== bareSan(reportedMove)) return null;
			return {
				kind: 'illegal-move',
				move: san,
				moveNumber,
				side,
				label,
				inCheck: chess.inCheck(),
				legalMoves: chess.moves(),
				context: [...played.slice(-3), label].join(' '),
			};
		}
	}
	return null;
};

/**
 * @param {string} pgn
 * @param {SyntaxError & { location?: { start?: { line?: number, column?: number } }, found?: unknown }} err
 * @returns {SyntaxErrorDetail | null}
 */
const diagnoseSyntax = (pgn, err) => {
	const line = err.location?.start?.line;
	const column = err.location?.start?.column;
	if (!line || !column) return null;
	const sourceLine = pgn.split(/\r?\n/)[line - 1] ?? '';
	const caret = `${' '.repeat(Math.max(0, column - 1))}^`;
	return {
		kind: 'syntax',
		line,
		column,
		snippet: `${sourceLine}\n${caret}`,
		found: typeof err.found === 'string' ? err.found : null,
	};
};

/** @param {IllegalMoveError} detail */
const formatIllegalMove = (detail) => {
	const sideName = detail.side === 'white' ? 'White' : 'Black';
	const check = detail.inCheck ? ` ${sideName} is in check.` : '';
	let legal = '';
	if (detail.legalMoves.length === 0) {
		legal = ' There are no legal moves in this position.';
	} else if (detail.legalMoves.length === 1) {
		legal = ` The only legal move is ${detail.legalMoves[0]}.`;
	} else {
		const shown = detail.legalMoves.slice(0, 8).join(', ');
		const extra = detail.legalMoves.length > 8 ? ` (${detail.legalMoves.length} total)` : '';
		legal = ` Legal moves: ${shown}${extra}.`;
	}
	return `Invalid PGN: ${detail.label} is not a legal move.${check}${legal}`;
};

/** @param {SyntaxErrorDetail} detail */
const formatSyntax = (detail) => {
	const found = detail.found == null ? 'the text ends' : `"${detail.found}"`;
	return `Invalid PGN at line ${detail.line}, column ${detail.column}: expected a move or game result, but ${found} was found.`;
};

/**
 * @param {unknown} err
 * @param {string} pgn
 * @returns {{ error: string, notationError?: NotationErrorDetail }}
 */
const describePgnFailure = (err, pgn) => {
	const message = err instanceof Error ? err.message : 'Invalid PGN.';
	const illegal = /^Invalid move in PGN: (.+)$/.exec(message);
	if (illegal) {
		const detail = diagnoseIllegalMove(pgn, illegal[1]);
		if (detail) {
			return { error: formatIllegalMove(detail), notationError: detail };
		}
		return {
			error: `Invalid PGN: ${illegal[1]} is not a legal move.`,
			notationError: {
				kind: 'illegal-move',
				move: illegal[1],
				moveNumber: 0,
				side: 'white',
				label: illegal[1],
				inCheck: false,
				legalMoves: [],
				context: illegal[1],
			},
		};
	}

	if (message.startsWith('Invalid FEN')) {
		return {
			error: `Invalid PGN: the starting position is illegal. ${message}`,
			notationError: { kind: 'fen', message },
		};
	}

	if (err instanceof Error && err.name === 'SyntaxError') {
		const detail = diagnoseSyntax(pgn, /** @type {SyntaxError} */ (err));
		if (detail) {
			return { error: formatSyntax(detail), notationError: detail };
		}
	}

	return { error: message.startsWith('Invalid PGN') ? message : `Invalid PGN: ${message}` };
};

/** @param {string} raw
 * @returns {NotationValidation}
 */
export const validateNotation = (raw) => {
	const trimmed = raw.trim();
	if (!trimmed) return { ok: true, notation: null };

	if (detectNotationType(trimmed) === 'fen') {
		try {
			const chess = new Chess();
			chess.load(trimmed);
			return { ok: true, notation: trimmed };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Invalid FEN string.';
			return {
				ok: false,
				error: message.startsWith('Invalid FEN') ? message : 'Invalid FEN string.',
			};
		}
	}

	try {
		const chess = new Chess();
		chess.loadPgn(trimmed);
		return { ok: true, notation: trimmed };
	} catch (err) {
		return { ok: false, ...describePgnFailure(err, trimmed) };
	}
};
