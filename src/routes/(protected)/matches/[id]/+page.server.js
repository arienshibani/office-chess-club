import { getMatches, getPlayers, ObjectId } from '$lib/db.js';
import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
	let oid;
	try {
		oid = new ObjectId(params.id);
	} catch {
		error(404, 'Match not found');
	}

	const matchesCol = await getMatches();
	const match = await matchesCol.findOne({ _id: oid });
	if (!match) error(404, 'Match not found');

	const playersCol = await getPlayers();
	const [white, black] = await Promise.all([
		playersCol.findOne({ _id: match.whitePlayerId }),
		playersCol.findOne({ _id: match.blackPlayerId })
	]);

	return {
		match: {
			_id: match._id.toString(),
			isDraw: match.isDraw,
			status: match.status,
			eloChange: match.eloChange,
			notation: match.notation ?? null,
			playedAt: match.playedAt,
			winnerId: match.winnerId?.toString() ?? null,
			whitePlayerId: match.whitePlayerId.toString(),
			blackPlayerId: match.blackPlayerId.toString()
		},
		white: white ? { _id: white._id.toString(), name: white.name, avatarUrl: white.avatarUrl, rating: white.rating } : null,
		black: black ? { _id: black._id.toString(), name: black.name, avatarUrl: black.avatarUrl, rating: black.rating } : null
	};
}
