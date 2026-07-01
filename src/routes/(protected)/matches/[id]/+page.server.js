import { error, fail, redirect } from '@sveltejs/kit';
import { validateNotation } from '$lib/chess/notation.js';
import { parseTimeFormatValue } from '$lib/chess/time-control.js';
import { getMatches, ObjectId } from '$lib/server/db.js';
import { deleteMatchById } from '$lib/server/matches/match-delete.js';
import { MATCH_STATUS_DRAFT } from '$lib/server/matches/match-status.js';
import { updateMatchResultById } from '$lib/server/matches/match-result-update.js';
import { buildMatchReviewData } from '$lib/server/matches/match-review-data.js';

/** @param {import('mongodb').ObjectId} whiteId @param {import('mongodb').ObjectId} blackId @param {string} userId */
const isMatchParticipant = (whiteId, blackId, userId) =>
	whiteId.toString() === userId || blackId.toString() === userId;

/** @param {import('mongodb').Document & { isDraw?: boolean, winnerId?: import('mongodb').ObjectId | null, whitePlayerId?: import('mongodb').ObjectId }} match */
const currentResultFromMatch = (match) =>
	match.isDraw
		? 'draw'
		: match.winnerId?.toString() === match.whitePlayerId?.toString()
			? 'white'
			: 'black';

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
	if (match.status === MATCH_STATUS_DRAFT) {
		redirect(303, '/submit?tab=drafts');
	}

	return buildMatchReviewData(match, locals.user);
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
					error: /** @type {string} */ (err.message),
				});
			}
			throw err;
		}

		redirect(303, '/matches');
	},

	correctResult: async ({ request, locals, params }) => {
		if (!locals.user) return fail(401, { error: 'Not authenticated.' });

		const form = await request.formData();
		const submittedResult = form.get('result')?.toString();
		const submittedTimeFormatRaw = form.get('timeFormat')?.toString();
		const submittedTimeFormat =
			typeof submittedTimeFormatRaw === 'string' ? submittedTimeFormatRaw.trim() : '';
		if (!submittedResult && !submittedTimeFormat) {
			return fail(400, { error: 'Missing changes.' });
		}

		let oid;
		try {
			oid = new ObjectId(params.id);
		} catch {
			return fail(404, { error: 'Match not found.' });
		}
		const matchesCol = await getMatches();
		const match = await matchesCol.findOne({ _id: oid });
		if (!match) return fail(404, { error: 'Match not found.' });

		const isAdmin = !!locals.user.isAdmin;
		const isParticipant = isMatchParticipant(
			match.whitePlayerId,
			match.blackPlayerId,
			locals.user._id,
		);
		if (!isAdmin && !isParticipant) {
			return fail(403, { error: 'Only players in this match can edit time format.' });
		}
		if (submittedTimeFormat && !parseTimeFormatValue(submittedTimeFormat)) {
			return fail(400, { error: 'Invalid time format.' });
		}

		const currentResult = currentResultFromMatch(match);
		const result = submittedResult || currentResult;
		if (!['white', 'black', 'draw'].includes(result)) {
			return fail(400, { error: 'Invalid result.' });
		}
		if (!isAdmin && result !== currentResult) {
			return fail(403, { error: 'Only admins can change match results.' });
		}

		try {
			await updateMatchResultById(
				params.id,
				/** @type {'white' | 'black' | 'draw'} */ (result),
				submittedTimeFormat || undefined,
			);
		} catch (err) {
			if (err && typeof err === 'object' && 'status' in err && 'message' in err) {
				return fail(/** @type {number} */ (err.status), {
					error: /** @type {string} */ (err.message),
				});
			}
			throw err;
		}

		return { resultCorrected: true, message: 'Match updated.' };
	},
};
