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
		if (result.ok) return;
		expect(result.error).toBeTruthy();
	});

	it('validates minimal PGN', () => {
		const pgn = '[Event "Test"]\n\n1. e4 e5 2. Nf3 *';
		expect(detectNotationType(pgn)).toBe('pgn');
		expect(validateNotation(pgn).ok).toBe(true);
	});

	it('names the illegal move and the legal reply', () => {
		const result = validateNotation('1. e4 e4');
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toContain('1... e4');
		expect(result.error).toContain('not a legal move');
		expect(result.notationError).toMatchObject({
			kind: 'illegal-move',
			move: 'e4',
			moveNumber: 1,
			side: 'black',
			label: '1... e4',
			inCheck: false,
		});
		expect(
			result.notationError?.kind === 'illegal-move' && result.notationError.legalMoves,
		).toContain('e5');
	});

	it('reports a discovered-check reply that stays in check', () => {
		const pgn = `[ePGN "0.1;DGT LiveChess/2.2.11"]
[Result "1-0"]

1. e4 {[%emt 00:00:35]} e5 2. Nc3 h6 3. Bc4 a6 4. f4 {[%emt
00:00:06]} exf4 5. Nf3 Nc6 6. d4 Qf6 7. Nd5 Qd8 8. Bxf4 d6 9. O-O Bg4 10. h3
Bh5 11. Qd2 g5 12. Bh2 Qd7 13. e5 O-O-O 14. exd6 Bxd6 15. b4 Bxh2+ 16. Kxh2 g4
17. Ne5 Nxe5 18. dxe5 gxh3 19. g3 c6 20. Nb6+ Kc7 21. Nxd7 Rxd7 22. Qf4 Kc8 23.
Rae1 Ne7 24. Bxf7 Bxf7 25. Qxf7 Rd2+ 26. Kh1 Nd5 27. Qe6+ Kc7 28. Rf7+ Kb6 29.
Qd7 Rb8 30. e6 Rxc2 31. e7 Rd2 32. e8=Q Rxe8 33. Qxe8 Nc3 34. Qe7 Kb5 35. Qc5+
Ka4 36. Qxc3 Rxa2 37. Rf4 Ra3 38. b5+ Ka5 39. Qb4+ Kb6 40. Qd4+ Kc7 41. Rf7+
Kb8 42. Qd8+ Ka7 43. Qc7 Rxg3 44. Qxb7# 1-0`;
		const result = validateNotation(pgn);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.notationError).toMatchObject({
			kind: 'illegal-move',
			move: 'Ka5',
			moveNumber: 38,
			side: 'black',
			label: '38... Ka5',
			inCheck: true,
			legalMoves: ['Kxb5'],
		});
		expect(result.error).toContain('38... Ka5');
		expect(result.error).toContain('Kxb5');
	});

	it('points at the line and column of a syntax error', () => {
		const result = validateNotation('1. e4 e5 2. ???');
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.notationError).toMatchObject({
			kind: 'syntax',
			line: 1,
			column: 13,
			found: '?',
		});
		expect(result.error).toContain('line 1, column 13');
		expect(result.notationError?.kind === 'syntax' && result.notationError.snippet).toContain('^');
	});
});
