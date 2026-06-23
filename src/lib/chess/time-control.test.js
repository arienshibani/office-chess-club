import { describe, expect, it } from 'vitest';
import {
	formatClockSeconds,
	getTimeFormatLabel,
	parseTimeFormatValue,
} from '$lib/chess/time-control.js';

describe('time-control', () => {
	it('parses supported time formats', () => {
		expect(parseTimeFormatValue('600+5')).toEqual({
			value: '600+5',
			baseSeconds: 600,
			incrementSeconds: 5,
		});
	});

	it('rejects invalid formats', () => {
		expect(parseTimeFormatValue('')).toBeNull();
		expect(parseTimeFormatValue('abc')).toBeNull();
		expect(parseTimeFormatValue('0+5')).toBeNull();
	});

	it('formats clock seconds and labels', () => {
		expect(formatClockSeconds(125)).toBe('2:05');
		expect(getTimeFormatLabel('600+5')).toBe('10+5 Rapid');
	});
});
