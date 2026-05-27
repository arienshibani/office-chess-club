import { getPlayers, getMatches, ObjectId } from '$lib/db.js';
import { enrichMatches } from '$lib/matches.js';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
	const [playersCol, matchesCol] = await Promise.all([getPlayers(), getMatches()]);

	const [leaderboard, recentMatches] = await Promise.all([
		playersCol.find({}).sort({ rating: -1 }).toArray(),
		matchesCol.find({}).sort({ playedAt: -1 }).limit(10).toArray()
	]);

	const enrichedMatches = await enrichMatches(playersCol, recentMatches, ObjectId);

	return {
		leaderboard: leaderboard.map((p) => ({
			_id: p._id.toString(),
			name: p.name,
			icon: typeof p.icon === 'string' ? p.icon : '',
			avatarUrl: p.avatarUrl ?? '',
			rating: p.rating,
			stats: p.stats
		})),
		recentMatches: enrichedMatches
	};
}
