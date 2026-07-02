import { describe, expect, it } from 'vitest';
import {
	clampMoveIndex,
	formatMoveHash,
	moveAnchorId,
	parseMoveHash,
} from '$lib/chess/move-hash.js';

describe('move-hash', () => {
	it('parses start aliases', () => {
		expect(parseMoveHash('#start')).toBe(-1);
		expect(parseMoveHash('0')).toBe(-1);
	});

	it('parses move number and color', () => {
		expect(parseMoveHash('#1w')).toBe(0);
		expect(parseMoveHash('1b')).toBe(1);
		expect(parseMoveHash('#m8w')).toBe(14);
		expect(parseMoveHash('8B')).toBe(15);
	});

	it('rejects invalid hashes', () => {
		expect(parseMoveHash('')).toBe(null);
		expect(parseMoveHash('#9')).toBe(null);
		expect(parseMoveHash('#0w')).toBe(null);
		expect(parseMoveHash('#nf3')).toBe(null);
	});

	it('formats view indices', () => {
		expect(formatMoveHash(-1)).toBe('start');
		expect(formatMoveHash(0)).toBe('1w');
		expect(formatMoveHash(1)).toBe('1b');
		expect(formatMoveHash(14)).toBe('8w');
		expect(formatMoveHash(15)).toBe('8b');
	});

	it('builds DOM anchor ids', () => {
		expect(moveAnchorId(14)).toBe('m8w');
	});

	it('clamps indices to game length', () => {
		expect(clampMoveIndex(3, 4)).toBe(3);
		expect(clampMoveIndex(4, 4)).toBe(null);
		expect(clampMoveIndex(-1, 4)).toBe(-1);
		expect(clampMoveIndex(null, 4)).toBe(null);
	});
});
