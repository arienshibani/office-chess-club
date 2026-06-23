import { describe, expect, it } from 'vitest';
import { computeElo } from '$lib/chess/elo.js';

describe('computeElo', () => {
	it('increases winner rating and decreases loser rating', () => {
		const result = computeElo(1200, 1200, 'white');

		expect(result.white.after).toBeGreaterThan(result.white.before);
		expect(result.black.after).toBeLessThan(result.black.before);
		expect(result.white.before).toBe(1200);
		expect(result.black.before).toBe(1200);
	});

	it('moves equal ratings slightly on a draw', () => {
		const result = computeElo(1200, 1200, 'draw');

		expect(result.white.after).toBe(result.black.after);
		expect(result.white.after).toBe(1200);
	});

	it('rewards an upset win more than a win at equal rating', () => {
		const favoriteWin = computeElo(1400, 1200, 'white');
		const upsetWin = computeElo(1200, 1400, 'white');

		const favoriteGain = favoriteWin.white.after - favoriteWin.white.before;
		const upsetGain = upsetWin.white.after - upsetWin.white.before;

		expect(upsetGain).toBeGreaterThan(favoriteGain);
	});
});
