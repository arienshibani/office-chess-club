export const DEFAULT_START_RATING = 1200;

/**
 * @typedef {{ playedAt: string, rating: number, delta: number, before: number, isStart?: boolean }} EloHistoryPoint
 */

/**
 * @param {import('mongodb').Document[]} docs
 * @param {string} playerId
 * @param {number} [startingRating]
 * @returns {EloHistoryPoint[]}
 */
export const buildEloHistoryFromDocs = (docs, playerId, startingRating = DEFAULT_START_RATING) => {
	const approved = docs
		.filter(
			(m) =>
				m.status === 'approved' &&
				m.eloChange &&
				typeof m.eloChange.white?.before === 'number' &&
				typeof m.eloChange.black?.before === 'number'
		)
		.sort((a, b) => new Date(a.playedAt).getTime() - new Date(b.playedAt).getTime());

	if (approved.length === 0) return [];

	/** @type {EloHistoryPoint[]} */
	const points = [];

	for (const [index, match] of approved.entries()) {
		const isWhite = match.whitePlayerId.toString() === playerId;
		const elo = isWhite ? match.eloChange.white : match.eloChange.black;
		const playedAt =
			match.playedAt instanceof Date ? match.playedAt.toISOString() : String(match.playedAt);

		if (index === 0) {
			points.push({
				playedAt,
				rating: elo.before ?? startingRating,
				delta: 0,
				before: elo.before ?? startingRating,
				isStart: true
			});
		}

		points.push({
			playedAt,
			rating: elo.after,
			delta: elo.after - elo.before,
			before: elo.before
		});
	}

	return points;
};

/**
 * @param {EloHistoryPoint[]} points
 * @param {{ width?: number, height?: number }} [options]
 */
export const buildEloChartGeometry = (points, options = {}) => {
	const width = options.width ?? 480;
	const height = options.height ?? 180;
	const pad = { top: 14, right: 14, bottom: 30, left: 40 };

	if (points.length < 2) {
		return { empty: true, width, height, pad };
	}

	const times = points.map((p) => new Date(p.playedAt).getTime());
	const ratings = points.map((p) => p.rating);

	let minR = Math.min(...ratings);
	let maxR = Math.max(...ratings);
	const rangePad = Math.max(12, Math.ceil((maxR - minR) * 0.12) || 16);
	minR -= rangePad;
	maxR += rangePad;
	if (minR === maxR) {
		minR -= 20;
		maxR += 20;
	}

	const minT = Math.min(...times);
	const maxT = Math.max(...times);
	const chartW = width - pad.left - pad.right;
	const chartH = height - pad.top - pad.bottom;

	/** @param {number} t */
	const toX = (t) =>
		pad.left + (maxT === minT ? chartW / 2 : ((t - minT) / (maxT - minT)) * chartW);

	/** @param {number} r */
	const toY = (r) => pad.top + chartH - ((r - minR) / (maxR - minR)) * chartH;

	const dots = points.map((p) => ({
		x: toX(new Date(p.playedAt).getTime()),
		y: toY(p.rating),
		rating: p.rating,
		delta: p.delta,
		playedAt: p.playedAt,
		isStart: !!p.isStart
	}));

	return {
		empty: false,
		width,
		height,
		pad,
		line: dots.map((d) => `${d.x},${d.y}`).join(' '),
		dots,
		yLabels: [
			{ y: toY(maxR), label: String(Math.round(maxR)) },
			{ y: toY((maxR + minR) / 2), label: String(Math.round((maxR + minR) / 2)) },
			{ y: toY(minR), label: String(Math.round(minR)) }
		],
		xStart: points[0].playedAt,
		xEnd: points[points.length - 1].playedAt,
		gridYs: [toY(maxR), toY((maxR + minR) / 2), toY(minR)]
	};
};

/** @param {string | Date} date */
export const formatChartDate = (date) =>
	new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

/** @param {string | Date} date */
export const formatChartTooltipDate = (date) =>
	new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
