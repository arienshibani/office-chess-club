/**
 * @param {import('mongodb').Collection} playersCol
 * @param {any[]} matches
 * @param {typeof import('$lib/server/db.js').ObjectId} ObjectId
 */
export const enrichMatches = async (playersCol, matches, ObjectId) => {
	const playerIds = [
		...new Set(
			matches.flatMap((m) => {
				const ids = [];
				if (m.whitePlayerId) ids.push(m.whitePlayerId.toString());
				if (m.blackPlayerId) ids.push(m.blackPlayerId.toString());
				return ids;
			}),
		),
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
		whitePlayerId: m.whitePlayerId?.toString() ?? null,
		blackPlayerId: m.blackPlayerId?.toString() ?? null,
		winnerId: m.winnerId?.toString() ?? null,
		whiteName: m.whitePlayerId
			? (playerMap[m.whitePlayerId.toString()]?.name ?? 'Unknown')
			: 'Unknown',
		blackName: m.blackPlayerId
			? (playerMap[m.blackPlayerId.toString()]?.name ?? 'Unknown')
			: 'Unknown',
		whiteIcon: m.whitePlayerId ? (playerMap[m.whitePlayerId.toString()]?.icon ?? '') : '',
		whiteAvatar: m.whitePlayerId ? (playerMap[m.whitePlayerId.toString()]?.avatarUrl ?? '') : '',
		blackIcon: m.blackPlayerId ? (playerMap[m.blackPlayerId.toString()]?.icon ?? '') : '',
		blackAvatar: m.blackPlayerId ? (playerMap[m.blackPlayerId.toString()]?.avatarUrl ?? '') : '',
	}));
};
