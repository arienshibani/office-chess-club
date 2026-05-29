/** Plain-text match summary (no icons). Prefer MatchSummary.svelte in UI. */
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
		minute: '2-digit'
	});

/**
 * @param {import('mongodb').Collection} playersCol
 * @param {any[]} matches
 * @param {typeof import('$lib/db.js').ObjectId} ObjectId
 */
export const enrichMatches = async (playersCol, matches, ObjectId) => {
	const playerIds = [
		...new Set(
			matches.flatMap((m) => [m.whitePlayerId.toString(), m.blackPlayerId.toString()])
		)
	];

	const playerDocs = playerIds.length
		? await playersCol.find({ _id: { $in: playerIds.map((id) => new ObjectId(id)) } }).toArray()
		: [];

	/** @type {Record<string, any>} */
	const playerMap = Object.fromEntries(playerDocs.map((p) => [p._id.toString(), p]));

	return matches.map((m) => ({
		_id: m._id.toString(),
		isDraw: m.isDraw,
		status: m.status,
		eloChange: m.eloChange,
		playedAt: m.playedAt,
		whitePlayerId: m.whitePlayerId.toString(),
		blackPlayerId: m.blackPlayerId.toString(),
		winnerId: m.winnerId?.toString() ?? null,
		whiteName: playerMap[m.whitePlayerId.toString()]?.name ?? 'Unknown',
		blackName: playerMap[m.blackPlayerId.toString()]?.name ?? 'Unknown',
		whiteIcon: playerMap[m.whitePlayerId.toString()]?.icon ?? '',
		whiteAvatar: playerMap[m.whitePlayerId.toString()]?.avatarUrl ?? '',
		blackIcon: playerMap[m.blackPlayerId.toString()]?.icon ?? '',
		blackAvatar: playerMap[m.blackPlayerId.toString()]?.avatarUrl ?? ''
	}));
};
