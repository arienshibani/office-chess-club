import { getMatches, getPlayers, ObjectId } from '$lib/db.js';
import { validateNotation } from '$lib/notation.js';
import { deleteMatchById } from '$lib/match-delete.js';
import { updateMatchResultById } from '$lib/match-result-update.js';
import { error, fail, redirect } from '@sveltejs/kit';

/** @param {import('mongodb').ObjectId} whiteId @param {import('mongodb').ObjectId} blackId @param {string} userId */
const isMatchParticipant = (whiteId, blackId, userId) =>
	whiteId.toString() === userId || blackId.toString() === userId;

/** @type {import('./$types').PageServerLoad} */
export async function load({ params, locals, depends }) {
	depends(`app:match:${params.id}`);

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

	const userId = locals.user?._id ?? '';
	const canEditNotation = !!userId && isMatchParticipant(match.whitePlayerId, match.blackPlayerId, userId);

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
		white: white
			? {
					_id: white._id.toString(),
					name: white.name,
					icon: typeof white.icon === 'string' ? white.icon : '',
					avatarUrl: white.avatarUrl,
					rating: white.rating
				}
			: null,
		black: black
			? {
					_id: black._id.toString(),
					name: black.name,
					icon: typeof black.icon === 'string' ? black.icon : '',
					avatarUrl: black.avatarUrl,
					rating: black.rating
				}
			: null,
		canEditNotation,
		isAdmin: !!locals.user?.isAdmin
	};
}

/** @type {import('./$types').Actions} */
export const actions = {
	updateNotation: async ({ request, params, locals }) => {
		if (!locals.user) return fail(401, { error: 'Not authenticated.' });

		let oid;
		try {
			oid = new ObjectId(params.id);
		} catch {
			return fail(404, { error: 'Match not found.' });
		}

		const matchesCol = await getMatches();
		const match = await matchesCol.findOne({ _id: oid });
		if (!match) return fail(404, { error: 'Match not found.' });

		if (!isMatchParticipant(match.whitePlayerId, match.blackPlayerId, locals.user._id)) {
			return fail(403, { error: 'Only players in this match can add notation.' });
		}

		const raw = String((await request.formData()).get('notation') ?? '');
		const parsed = validateNotation(raw);
		if (!parsed.ok) return fail(400, { error: parsed.error });

		await matchesCol.updateOne({ _id: oid }, { $set: { notation: parsed.notation } });

		return { notationSuccess: true, message: 'Notation saved.' };
	},

	deleteMatch: async ({ locals, params }) => {
		if (!locals.user?.isAdmin) return fail(403, { error: 'Admin access required.' });

		try {
			await deleteMatchById(params.id);
		} catch (err) {
			if (err && typeof err === 'object' && 'status' in err && 'message' in err) {
				return fail(/** @type {number} */ (err.status), {
					error: /** @type {string} */ (err.message)
				});
			}
			throw err;
		}

		redirect(303, '/matches');
	},

	correctResult: async ({ request, locals, params }) => {
		if (!locals.user?.isAdmin) return fail(403, { error: 'Admin access required.' });

		const form = await request.formData();
		const result = form.get('result')?.toString();
		if (!result) return fail(400, { error: 'Missing result.' });

		try {
			await updateMatchResultById(
				params.id,
				/** @type {'white' | 'black' | 'draw'} */ (result)
			);
		} catch (err) {
			if (err && typeof err === 'object' && 'status' in err && 'message' in err) {
				return fail(/** @type {number} */ (err.status), {
					error: /** @type {string} */ (err.message)
				});
			}
			throw err;
		}

		return { resultCorrected: true, message: 'Match result updated.' };
	}
};
