import { describe, expect, it } from 'vitest';
import { detectNotationType, validateNotation } from '$lib/chess/notation.js';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

describe('notation', () => {
	it('accepts empty notation', () => {
		expect(validateNotation('')).toEqual({ ok: true, notation: null });
	});

	it('detects and validates FEN', () => {
		expect(detectNotationType(START_FEN)).toBe('fen');
		expect(validateNotation(START_FEN)).toEqual({ ok: true, notation: START_FEN });
	});

	it('rejects invalid FEN', () => {
		const result = validateNotation('not a fen');
		expect(result.ok).toBe(false);
		expect(result.error).toBeTruthy();
	});

	it('validates minimal PGN', () => {
		const pgn = '[Event "Test"]\n\n1. e4 e5 2. Nf3 *';
		expect(detectNotationType(pgn)).toBe('pgn');
		expect(validateNotation(pgn).ok).toBe(true);
	});
});
