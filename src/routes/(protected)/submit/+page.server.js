import { getPlayers, getConfig } from '$lib/db.js';
import { getHttpSubmitConfig } from '$lib/http-submit-config.js';
import { fail } from '@sveltejs/kit';
import { createMatch } from '$lib/match-submit.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ url }) {
	const [playersCol, cfgCol] = await Promise.all([getPlayers(), getConfig()]);

	const [players, config, httpSubmit] = await Promise.all([
		playersCol.find({}).sort({ rating: -1 }).toArray(),
		cfgCol.findOne(/** @type {any} */ ({ _id: 'global_settings' })),
		getHttpSubmitConfig()
	]);

	return {
		honorSystemEnabled: config?.honorSystemEnabled ?? true,
		allPlayers: players.map((p) => ({ _id: p._id.toString(), name: p.name, rating: p.rating })),
		apiSubmitEnabled: httpSubmit.enabled && !!httpSubmit.apiKey,
		apiSubmitUrl: `${url.origin}/api/matches`,
		apiSubmitKey: httpSubmit.apiKey
	};
}

/** @type {import('./$types').Actions} */
export const actions = {
	logMatch: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'Not authenticated' });

		const data = await request.formData();
		const whiteId = data.get('whiteId')?.toString();
		const blackId = data.get('blackId')?.toString();
		const resultRaw = data.get('result')?.toString();
		const notation = data.get('notation')?.toString();

		if (!whiteId || !blackId || !resultRaw) {
			return fail(400, { error: 'Missing required fields' });
		}
		if (whiteId === blackId) {
			return fail(400, { error: 'Players must be different' });
		}
		if (!['white', 'black', 'draw'].includes(resultRaw)) {
			return fail(400, { error: 'Invalid result' });
		}
		const result = /** @type {'white' | 'black' | 'draw'} */ (resultRaw);

		try {
			const { matchId, status } = await createMatch({
				whitePlayerId: whiteId,
				blackPlayerId: blackId,
				result,
				notation,
				reportedBy: locals.user._id,
				reporterName: locals.user.name
			});

			return {
				success: true,
				matchId,
				status,
				message:
					status === 'approved'
						? 'Match logged and ratings updated!'
						: 'Match submitted — pending admin approval.'
			};
		} catch (err) {
			if (err && typeof err === 'object' && 'status' in err && 'message' in err) {
				return fail(/** @type {number} */ (err.status), { error: /** @type {string} */ (err.message) });
			}
			throw err;
		}
	}
};
