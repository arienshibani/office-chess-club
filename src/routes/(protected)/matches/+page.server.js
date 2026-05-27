import { getPlayers, getMatches, ObjectId } from '$lib/db.js';
import { enrichMatches } from '$lib/matches.js';

const PER_PAGE = 10;

/** @type {import('./$types').PageServerLoad} */
export async function load({ url }) {
	const rawPage = parseInt(url.searchParams.get('page') ?? '1', 10);
	const requestedPage = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

	const [playersCol, matchesCol] = await Promise.all([getPlayers(), getMatches()]);

	const total = await matchesCol.countDocuments({});
	const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
	const page = Math.min(requestedPage, totalPages);
	const skip = (page - 1) * PER_PAGE;

	const matches = await matchesCol
		.find({})
		.sort({ playedAt: -1 })
		.skip(skip)
		.limit(PER_PAGE)
		.toArray();

	const enrichedMatches = await enrichMatches(playersCol, matches, ObjectId);

	return {
		matches: enrichedMatches,
		pagination: {
			page,
			totalPages,
			total,
			perPage: PER_PAGE,
			hasPrev: page > 1,
			hasNext: page < totalPages
		}
	};
}
