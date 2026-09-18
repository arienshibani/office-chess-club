import { evalToWhitePercent, formatEvalLabel } from '$lib/stockfish/eval-display.js';

/** @typedef {{ cp?: number, mate?: number } | null | undefined} EvalPoint */

/**
 * Map eval to Lichess-style advantage in [-1, 1] (white's perspective).
 * Uses the same win-probability curve as the eval bar so both stay consistent.
 * @param {EvalPoint} point
 */
export const evalToAdvantage = (point) => {
	if (!point) return null;
	return evalToWhitePercent(point) / 50 - 1;
};

/**
 * @param {EvalPoint} point
 * @param {number} chartIndex Index in the eval timeline (0 = start)
 */
export const formatEvalChartHover = (point, chartIndex) => {
	const evalLabel = formatEvalLabel(point) || '—';
	if (chartIndex <= 0) return { title: 'Start', evalLabel };
	const moveNumber = Math.floor((chartIndex - 1) / 2) + 1;
	const color = (chartIndex - 1) % 2 === 0 ? 'White' : 'Black';
	return { title: `${moveNumber}. ${color}`, evalLabel };
};

/**
 * @typedef {object} EvalChartPoint
 * @property {number} index
 * @property {number} x
 * @property {number} y
 * @property {number} advantage
 * @property {{ cp?: number, mate?: number }} eval
 */

/**
 * @typedef {object} EvalChartGeometry
 * @property {boolean} empty
 * @property {number} width
 * @property {number} height
 * @property {number} midY
 * @property {number} plotLeft
 * @property {number} plotRight
 * @property {number} plotTop
 * @property {number} plotBottom
 * @property {EvalChartPoint[]} points
 * @property {string} linePath
 * @property {string} areaPath
 * @property {{ x: number, label: string }[]} xLabels
 * @property {number | null} cursorX
 */

const WIDTH = 480;
const HEIGHT = 96;
const PAD = { top: 8, right: 8, bottom: 18, left: 8 };

/**
 * @param {(EvalPoint)[]} evals
 * @param {{ activeIndex?: number | null }} [options] activeIndex is timeline index (0 = start)
 * @returns {EvalChartGeometry}
 */
export const buildEvalChartGeometry = (evals, options = {}) => {
	const plotLeft = PAD.left;
	const plotRight = WIDTH - PAD.right;
	const plotTop = PAD.top;
	const plotBottom = HEIGHT - PAD.bottom;
	const midY = (plotTop + plotBottom) / 2;
	const plotWidth = plotRight - plotLeft;
	const plotHeight = plotBottom - plotTop;

	const empty = {
		empty: true,
		width: WIDTH,
		height: HEIGHT,
		midY,
		plotLeft,
		plotRight,
		plotTop,
		plotBottom,
		points: /** @type {EvalChartPoint[]} */ ([]),
		linePath: '',
		areaPath: '',
		xLabels: /** @type {{ x: number, label: string }[]} */ ([]),
		cursorX: null,
	};

	if (!Array.isArray(evals) || evals.length < 2) return empty;

	/** @type {EvalChartPoint[]} */
	const points = [];
	const last = evals.length - 1;

	for (let i = 0; i < evals.length; i++) {
		const point = evals[i];
		if (!point || typeof point !== 'object') continue;
		const advantage = evalToAdvantage(point);
		if (advantage == null) continue;
		const x = plotLeft + (last === 0 ? 0 : (i / last) * plotWidth);
		// advantage +1 (white winning) → top of chart
		const y = midY - advantage * (plotHeight / 2);
		points.push({
			index: i,
			x,
			y,
			advantage,
			eval: point,
		});
	}

	if (points.length < 2) return empty;

	const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
	const areaPath = `M ${points[0].x} ${midY} ${points
		.map((p) => `L ${p.x} ${p.y}`)
		.join(' ')} L ${points[points.length - 1].x} ${midY} Z`;

	/** @type {{ x: number, label: string }[]} */
	const xLabels = [];
	const moveCount = Math.max(0, evals.length - 1);
	const labelEvery = moveCount <= 20 ? 5 : moveCount <= 40 ? 10 : 20;
	for (let ply = labelEvery; ply <= moveCount; ply += labelEvery) {
		const moveNumber = Math.ceil(ply / 2);
		const x = plotLeft + (ply / last) * plotWidth;
		xLabels.push({ x, label: String(moveNumber) });
	}

	const activeIndex =
		typeof options.activeIndex === 'number' && Number.isFinite(options.activeIndex)
			? options.activeIndex
			: null;
	let cursorX = null;
	if (activeIndex != null && activeIndex >= 0 && last > 0) {
		const clamped = Math.min(last, Math.max(0, activeIndex));
		cursorX = plotLeft + (clamped / last) * plotWidth;
	} else if (activeIndex === 0) {
		cursorX = plotLeft;
	}

	return {
		empty: false,
		width: WIDTH,
		height: HEIGHT,
		midY,
		plotLeft,
		plotRight,
		plotTop,
		plotBottom,
		points,
		linePath,
		areaPath,
		xLabels,
		cursorX,
	};
};

/**
 * Map a pointer x (in viewBox coords) to the nearest timeline index.
 * @param {EvalChartGeometry} chart
 * @param {number} svgX
 */
export const nearestEvalChartIndex = (chart, svgX) => {
	if (chart.empty || chart.points.length === 0) return null;
	let best = chart.points[0];
	let bestDist = Math.abs(best.x - svgX);
	for (let i = 1; i < chart.points.length; i++) {
		const dist = Math.abs(chart.points[i].x - svgX);
		if (dist < bestDist) {
			best = chart.points[i];
			bestDist = dist;
		}
	}
	return best.index;
};
