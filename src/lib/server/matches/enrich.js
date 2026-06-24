/**
 * @param {import('mongodb').Collection} playersCol
 * @param {any[]} matches
 * @param {typeof import('$lib/server/db.js').ObjectId} ObjectId
 */
export const enrichMatches = async (playersCol, matches, ObjectId) => {
	const playerIds = [
		...new Set(matches.flatMap((m) => [m.whitePlayerId.toString(), m.blackPlayerId.toString()])),
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
		timeFormat: typeof m.timeFormat === 'string' ? m.timeFormat : null,
		whitePlayerId: m.whitePlayerId.toString(),
		blackPlayerId: m.blackPlayerId.toString(),
		winnerId: m.winnerId?.toString() ?? null,
		whiteName: playerMap[m.whitePlayerId.toString()]?.name ?? 'Unknown',
		blackName: playerMap[m.blackPlayerId.toString()]?.name ?? 'Unknown',
		whiteIcon: playerMap[m.whitePlayerId.toString()]?.icon ?? '',
		whiteAvatar: playerMap[m.whitePlayerId.toString()]?.avatarUrl ?? '',
		blackIcon: playerMap[m.blackPlayerId.toString()]?.icon ?? '',
		blackAvatar: playerMap[m.blackPlayerId.toString()]?.avatarUrl ?? '',
	}));
};
