import { getPlayers, getMatches, ObjectId } from '$lib/db.js';
import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
	let oid;
	try {
		oid = new ObjectId(params.id);
	} catch {
		error(404, 'Player not found');
	}

	const [playersCol, matchesCol] = await Promise.all([getPlayers(), getMatches()]);

	const [player, allPlayers] = await Promise.all([
		playersCol.findOne({ _id: oid }),
		playersCol.find({}).sort({ rating: -1 }).toArray()
	]);

	if (!player) error(404, 'Player not found');

	const rank = allPlayers.findIndex((p) => p._id.toString() === params.id) + 1;

	const matches = await matchesCol
		.find({
			$or: [{ whitePlayerId: oid }, { blackPlayerId: oid }]
		})
		.sort({ playedAt: -1 })
		.limit(50)
		.toArray();

	// Collect opponent IDs
	const opponentIds = [
		...new Set(
			matches.map((m) =>
				m.whitePlayerId.toString() === params.id
					? m.blackPlayerId.toString()
					: m.whitePlayerId.toString()
			)
		)
	];

	const opponents = await playersCol
		.find({ _id: { $in: opponentIds.map((id) => new ObjectId(id)) } })
		.toArray();

	const oppMap = Object.fromEntries(opponents.map((p) => [p._id.toString(), p]));

	const enriched = matches.map((m) => {
		const isWhite = m.whitePlayerId.toString() === params.id;
		const opponentId = isWhite ? m.blackPlayerId.toString() : m.whitePlayerId.toString();
		const opponent = oppMap[opponentId];
		const playerElo = isWhite ? m.eloChange.white : m.eloChange.black;
		const won = m.winnerId?.toString() === params.id;
		const lost = !m.isDraw && m.winnerId?.toString() !== params.id;

		return {
			_id: m._id.toString(),
			opponentId,
			opponentName: opponent?.name ?? 'Unknown',
			opponentAvatar: opponent?.avatarUrl ?? '',
			isWhite,
			isDraw: m.isDraw,
			won,
			lost,
			status: m.status,
			eloBefore: playerElo.before,
			eloAfter: playerElo.after,
			eloChange: playerElo.after - playerElo.before,
			playedAt: m.playedAt
		};
	});

	return {
		player: {
			_id: player._id.toString(),
			name: /** @type {string} */ (player.name),
			avatarUrl: /** @type {string} */ (player.avatarUrl ?? ''),
			rating: /** @type {number} */ (player.rating),
			isAdmin: /** @type {boolean} */ (player.isAdmin),
			stats: /** @type {{ wins: number, losses: number, draws: number }} */ (player.stats)
		},
		matches: enriched,
		rank
	};
}
