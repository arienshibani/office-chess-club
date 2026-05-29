import { getPlayers, getMatches, ObjectId } from '$lib/db.js';
import { enrichMatches } from '$lib/matches.js';
import { deleteMatchById } from '$lib/match-delete.js';
import { fail, redirect } from '@sveltejs/kit';

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

/** @type {import('./$types').Actions} */
export const actions = {
	deleteMatch: async ({ request, locals, url }) => {
		if (!locals.user?.isAdmin) return fail(403, { error: 'Admin access required.' });

		const form = await request.formData();
		const matchId = form.get('matchId')?.toString();
		const returnTo = form.get('returnTo')?.toString();
		if (!matchId) return fail(400, { error: 'Missing match ID.' });

		try {
			await deleteMatchById(matchId);
		} catch (err) {
			if (err && typeof err === 'object' && 'status' in err && 'message' in err) {
				return fail(/** @type {number} */ (err.status), {
					error: /** @type {string} */ (err.message)
				});
			}
			throw err;
		}

		if (returnTo?.startsWith('/')) {
			redirect(303, returnTo);
		}
		const rawPage = url.searchParams.get('page');
		const redirectTo = rawPage && rawPage !== '1' ? `/matches?page=${rawPage}` : '/matches';
		redirect(303, redirectTo);
	}
};
