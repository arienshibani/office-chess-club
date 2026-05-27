/** @typedef {{ wins: number, losses: number, draws: number }} ColorRecord */

/**
 * @param {Array<{ status: string, isWhite: boolean, isDraw: boolean, won: boolean }>} matches
 * @returns {{ white: ColorRecord, black: ColorRecord }}
 */
export const computeColorStats = (matches) => {
	/** @type {{ white: ColorRecord, black: ColorRecord }} */
	const stats = {
		white: { wins: 0, losses: 0, draws: 0 },
		black: { wins: 0, losses: 0, draws: 0 }
	};

	for (const match of matches) {
		if (match.status === 'pending') continue;
		const side = match.isWhite ? stats.white : stats.black;
		if (match.isDraw) side.draws++;
		else if (match.won) side.wins++;
		else side.losses++;
	}

	return stats;
};

/** @param {ColorRecord} record */
export const colorWinRate = (record) => {
	const total = record.wins + record.losses + record.draws;
	return total > 0 ? Math.round((record.wins / total) * 100) : 0;
};

/** @param {ColorRecord} record */
export const pieGradient = (record) => {
	const total = record.wins + record.losses + record.draws;
	if (total === 0) return 'conic-gradient(#2a2a2a 0% 100%)';

	const winPct = (record.wins / total) * 100;
	const lossPct = (record.losses / total) * 100;
	const drawPct = (record.draws / total) * 100;
	let cursor = 0;
	/** @type {string[]} */
	const stops = [];

	if (record.wins > 0) {
		stops.push(`#60c060 ${cursor}% ${cursor + winPct}%`);
		cursor += winPct;
	}
	if (record.losses > 0) {
		stops.push(`#e06060 ${cursor}% ${cursor + lossPct}%`);
		cursor += lossPct;
	}
	if (record.draws > 0) {
		stops.push(`#666 ${cursor}% ${cursor + drawPct}%`);
	}

	return `conic-gradient(${stops.join(', ')})`;
};
