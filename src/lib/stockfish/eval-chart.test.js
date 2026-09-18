import { describe, expect, it } from 'vitest';
import {
	buildEvalChartGeometry,
	evalToAdvantage,
	formatEvalChartHover,
	nearestEvalChartIndex,
} from '$lib/stockfish/eval-chart.js';

describe('eval-chart', () => {
	it('maps equal positions near zero advantage', () => {
		const adv = evalToAdvantage({ cp: 0 });
		expect(adv).not.toBeNull();
		expect(Math.abs(/** @type {number} */ (adv))).toBeLessThan(0.02);
	});

	it('maps white mate to max advantage', () => {
		expect(evalToAdvantage({ mate: 1 })).toBe(1);
		expect(evalToAdvantage({ mate: -2 })).toBe(-1);
	});

	it('builds an area path for a short game', () => {
		const evals = [{ cp: 20 }, { cp: 80 }, { cp: -40 }, { cp: -200 }];
		const chart = buildEvalChartGeometry(evals, { activeIndex: 2 });
		expect(chart.empty).toBe(false);
		expect(chart.points.length).toBe(4);
		expect(chart.linePath.startsWith('M ')).toBe(true);
		expect(chart.areaPath.includes('Z')).toBe(true);
		expect(chart.cursorX).not.toBeNull();
	});

	it('returns empty when evals are incomplete', () => {
		expect(buildEvalChartGeometry([]).empty).toBe(true);
		expect(buildEvalChartGeometry([{ cp: 0 }]).empty).toBe(true);
		expect(buildEvalChartGeometry([{ cp: 0 }, null, { cp: 10 }]).points.length).toBe(2);
	});

	it('finds nearest index from pointer x', () => {
		const evals = [{ cp: 0 }, { cp: 50 }, { cp: 100 }, { cp: 20 }];
		const chart = buildEvalChartGeometry(evals);
		expect(nearestEvalChartIndex(chart, chart.points[0].x)).toBe(0);
		expect(nearestEvalChartIndex(chart, chart.points[2].x)).toBe(2);
	});

	it('formats hover labels', () => {
		expect(formatEvalChartHover({ cp: 35 }, 0)).toEqual({
			title: 'Start',
			evalLabel: '+0.3',
		});
		expect(formatEvalChartHover({ cp: -120 }, 2).title).toBe('1. Black');
	});
});
