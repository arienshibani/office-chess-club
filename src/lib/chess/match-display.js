/**
 * Plain-text match summary (no icons). Prefer MatchSummary.svelte in UI.
 * @param {{
 *   whiteName: string,
 *   blackName: string,
 *   isDraw: boolean,
 *   winnerId: string | null,
 *   whitePlayerId: string
 * }} match
 */
export const matchSummary = (match) => {
	const white = match.whiteName;
	const black = match.blackName;
	if (match.isDraw) return `${white} ½–½ ${black}`;
	if (match.winnerId === match.whitePlayerId) return `${white} defeated ${black}`;
	return `${black} defeated ${white}`;
};

/**
 * @param {{ status: string, eloChange: { white: { before: number, after: number }, black: { before: number, after: number } } }} match
 */
export const eloDisplay = (match) => {
	const prefix = match.status === 'pending' ? '~' : '';
	const wd = match.eloChange.white.after - match.eloChange.white.before;
	const bd = match.eloChange.black.after - match.eloChange.black.before;
	return `${prefix}${wd >= 0 ? '+' : ''}${wd} / ${prefix}${bd >= 0 ? '+' : ''}${bd}`;
};

/** @param {string | Date} date */
export const formatMatchTimestamp = (date) =>
	new Date(date).toLocaleString(undefined, {
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
	});
