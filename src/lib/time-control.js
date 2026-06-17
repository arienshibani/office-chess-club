/** @typedef {{ value: string, label: string, baseSeconds: number, incrementSeconds: number }} TimeFormatOption */

/** @type {TimeFormatOption[]} */
export const TIME_FORMAT_OPTIONS = [
	{ value: '180+0', label: '3+0 Blitz', baseSeconds: 180, incrementSeconds: 0 },
	{ value: '180+2', label: '3+2 Blitz', baseSeconds: 180, incrementSeconds: 2 },
	{ value: '300+0', label: '5+0 Blitz', baseSeconds: 300, incrementSeconds: 0 },
	{ value: '300+3', label: '5+3 Blitz', baseSeconds: 300, incrementSeconds: 3 },
	{ value: '600+0', label: '10+0 Rapid', baseSeconds: 600, incrementSeconds: 0 },
	{ value: '600+5', label: '10+5 Rapid', baseSeconds: 600, incrementSeconds: 5 },
	{ value: '900+10', label: '15+10 Rapid', baseSeconds: 900, incrementSeconds: 10 },
	{ value: '1800+0', label: '30+0 Classical', baseSeconds: 1800, incrementSeconds: 0 }
];

export const DEFAULT_TIME_FORMAT = TIME_FORMAT_OPTIONS[5].value;

/** @param {string | null | undefined} value */
export const parseTimeFormatValue = (value) => {
	if (typeof value !== 'string') return null;
	const trimmed = value.trim();
	if (!trimmed) return null;
	const match = /^(\d{1,5})\+(\d{1,3})$/.exec(trimmed);
	if (!match) return null;
	const baseSeconds = Number.parseInt(match[1], 10);
	const incrementSeconds = Number.parseInt(match[2], 10);
	if (!Number.isFinite(baseSeconds) || !Number.isFinite(incrementSeconds)) return null;
	if (baseSeconds <= 0 || incrementSeconds < 0) return null;
	return {
		value: `${baseSeconds}+${incrementSeconds}`,
		baseSeconds,
		incrementSeconds
	};
};

/** @param {string | null | undefined} value */
export const getTimeFormatLabel = (value) => {
	const parsed = parseTimeFormatValue(value);
	if (!parsed) return 'Not set';
	const known = TIME_FORMAT_OPTIONS.find((item) => item.value === parsed.value);
	if (known) return known.label;
	const baseMinutes = parsed.baseSeconds / 60;
	return `${baseMinutes % 1 === 0 ? baseMinutes : baseMinutes.toFixed(1)}+${parsed.incrementSeconds}`;
};

/** @param {number} totalSeconds */
export const formatClockSeconds = (totalSeconds) => {
	const safe = Math.max(0, Math.floor(totalSeconds));
	const hours = Math.floor(safe / 3600);
	const minutes = Math.floor((safe % 3600) / 60);
	const seconds = safe % 60;
	if (hours > 0) {
		return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
	}
	return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

/** @param {string | null | undefined} pgn */
export const extractElapsedMoveTimes = (pgn) => {
	if (typeof pgn !== 'string' || !pgn.trim()) return [];
	/** @type {(number | null)[]} */
	const values = [];
	const regex = /\{\s*\[%emt\s+(\d{2}):(\d{2}):(\d{2})\]\s*\}/g;
	for (const match of pgn.matchAll(regex)) {
		const h = Number.parseInt(match[1], 10);
		const m = Number.parseInt(match[2], 10);
		const s = Number.parseInt(match[3], 10);
		if ([h, m, s].every((n) => Number.isFinite(n))) {
			values.push(h * 3600 + m * 60 + s);
		}
	}
	return values;
};

/**
 * @param {(number | null)[]} elapsedByPly
 * @param {number} baseSeconds
 * @param {number} incrementSeconds
 */
export const computeClockStateByPly = (elapsedByPly, baseSeconds, incrementSeconds) => {
	let white = baseSeconds;
	let black = baseSeconds;
	/** @type {({ white: number, black: number } | null)[]} */
	const byPly = [];

	for (let i = 0; i < elapsedByPly.length; i++) {
		const spent = elapsedByPly[i];
		if (i % 2 === 0) {
			white = Math.max(0, white - (spent ?? 0)) + incrementSeconds;
		} else {
			black = Math.max(0, black - (spent ?? 0)) + incrementSeconds;
		}
		byPly.push({ white, black });
	}

	return byPly;
};
