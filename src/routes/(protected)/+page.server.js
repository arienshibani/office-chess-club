import { getMatches, getPlayers, ObjectId } from '$lib/server/db.js';
import { enrichMatches } from '$lib/server/matches/enrich.js';
import { buildMatchReviewData, pickRandomPgnMatch } from '$lib/server/matches/match-review-data.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
	const [playersCol, matchesCol] = await Promise.all([getPlayers(), getMatches()]);

	const [leaderboard, recentMatches, randomMatch] = await Promise.all([
		playersCol.find({}).sort({ rating: -1 }).toArray(),
		matchesCol.find({}).sort({ playedAt: -1 }).limit(3).toArray(),
		pickRandomPgnMatch(matchesCol),
	]);

	const [enrichedMatches, showcasedMatch] = await Promise.all([
		enrichMatches(playersCol, recentMatches, ObjectId),
		randomMatch ? buildMatchReviewData(randomMatch, locals.user) : null,
	]);

	return {
		leaderboard: leaderboard.map((p) => ({
			_id: p._id.toString(),
			name: p.name,
			icon: typeof p.icon === 'string' ? p.icon : '',
			avatarUrl: p.avatarUrl ?? '',
			rating: p.rating,
			stats: p.stats,
		})),
		recentMatches: enrichedMatches,
		showcasedMatch,
	};
}
