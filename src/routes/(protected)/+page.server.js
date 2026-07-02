import { getMatches, getPlayers, ObjectId } from '$lib/server/db.js';
import { enrichMatches } from '$lib/server/matches/enrich.js';
import {
	buildMatchReviewData,
	pickLatestFeaturedMatch,
} from '$lib/server/matches/match-review-data.js';
import { PUBLIC_MATCH_FILTER } from '$lib/server/matches/match-status.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
	const [playersCol, matchesCol] = await Promise.all([getPlayers(), getMatches()]);

	const [leaderboard, recentMatches, featuredMatch] = await Promise.all([
		playersCol.find({}).sort({ rating: -1 }).toArray(),
		matchesCol.find(PUBLIC_MATCH_FILTER).sort({ playedAt: -1 }).limit(3).toArray(),
		pickLatestFeaturedMatch(matchesCol),
	]);

	const [enrichedMatches, showcasedMatch] = await Promise.all([
		enrichMatches(playersCol, recentMatches, ObjectId),
		featuredMatch ? buildMatchReviewData(featuredMatch, locals.user) : null,
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
