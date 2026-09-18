import { describe, expect, it } from 'vitest';
import {
	BLUNDER_CP_THRESHOLD,
	centipawnLossForMover,
	evalToComparableCp,
	findBlunderPlyIndices,
} from '$lib/stockfish/classify-moves.js';

describe('classify-moves', () => {
	it('maps mate scores to large comparable values', () => {
		expect(evalToComparableCp({ mate: 1 })).toBe(9999);
		expect(evalToComparableCp({ mate: -2 })).toBe(-9998);
		expect(evalToComparableCp({ cp: 35 })).toBe(35);
		expect(evalToComparableCp(null)).toBe(null);
	});

	it('computes centipawn loss for the mover', () => {
		expect(centipawnLossForMover({ cp: 100 }, { cp: -150 }, true)).toBe(250);
		expect(centipawnLossForMover({ cp: -50 }, { cp: 200 }, false)).toBe(250);
		expect(centipawnLossForMover({ cp: 20 }, { cp: 10 }, true)).toBe(10);
	});

	it('flags big blunders by ply index', () => {
		const evals = [
			{ cp: 20 },
			{ cp: 15 },
			{ cp: 10 },
			{ cp: -250 }, // white blundered on ply 2 (move 2)
			{ cp: -240 },
		];
		const blunders = findBlunderPlyIndices(evals);
		expect(blunders.has(2)).toBe(true);
		expect(blunders.has(0)).toBe(false);
		expect(blunders.has(1)).toBe(false);
	});

	it('treats hanging into mate as a blunder', () => {
		const evals = [{ cp: 30 }, { mate: -1 }];
		const blunders = findBlunderPlyIndices(evals, { threshold: BLUNDER_CP_THRESHOLD });
		expect(blunders.has(0)).toBe(true);
	});

	it('returns empty set when evals are incomplete', () => {
		expect(findBlunderPlyIndices([]).size).toBe(0);
		expect(findBlunderPlyIndices([{ cp: 0 }]).size).toBe(0);
		expect(findBlunderPlyIndices([{ cp: 0 }, null]).size).toBe(0);
	});
});
