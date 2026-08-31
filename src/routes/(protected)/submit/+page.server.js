import { fail, redirect } from '@sveltejs/kit';
import {
	DEFAULT_TIME_FORMAT,
	parseTimeFormatValue,
	TIME_FORMAT_OPTIONS,
} from '$lib/chess/time-control.js';
import {
	canFinalizeDrafts,
	canSeeDraftsTab,
	getDraftConfig,
} from '$lib/server/config/draft-config.js';
import { getHttpSubmitConfig } from '$lib/server/config/http-submit-config.js';
import { getConfig, getMatches, getPlayers } from '$lib/server/db.js';
import { MATCH_STATUS_DRAFT } from '$lib/server/matches/match-status.js';
import { createMatch, finalizeDraftMatch } from '$lib/server/matches/match-submit.js';
import { canSubmitMatches } from '$lib/server/players/player-status.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ url, locals }) {
	if (!locals.user) {
		redirect(302, `/login?next=${encodeURIComponent(url.pathname)}`);
	}
	const [playersCol, cfgCol, matchesCol] = await Promise.all([
		getPlayers(),
		getConfig(),
		getMatches(),
	]);

	const [players, config, httpSubmit, draftConfig] = await Promise.all([
		playersCol.find({}).sort({ rating: -1 }).toArray(),
		cfgCol.findOne(/** @type {any} */ ({ _id: 'global_settings' })),
		getHttpSubmitConfig(),
		getDraftConfig(),
	]);

	const showDraftsTab = canSeeDraftsTab(locals.user, draftConfig);
	const tabParam = url.searchParams.get('tab');
	const activeTab = tabParam === 'drafts' && showDraftsTab ? 'drafts' : 'manual';

	const drafts = showDraftsTab
		? await matchesCol.find({ status: MATCH_STATUS_DRAFT }).sort({ playedAt: -1 }).toArray()
		: [];

	return {
		canSubmit: canSubmitMatches(locals.user),
		showDraftsTab,
		boardUploadsEnabled: draftConfig.httpSubmitEnabled,
		activeTab,
		drafts: drafts.map((draft) => ({
			_id: draft._id.toString(),
			draftResult: draft.draftResult,
			notation: draft.notation ?? null,
			timeFormat: typeof draft.timeFormat === 'string' ? draft.timeFormat : null,
			playedAt: draft.playedAt,
		})),
		honorSystemEnabled: config?.honorSystemEnabled ?? true,
		allPlayers: players.map((p) => ({ _id: p._id.toString(), name: p.name, rating: p.rating })),
		timeFormatOptions: TIME_FORMAT_OPTIONS,
		defaultTimeFormat: DEFAULT_TIME_FORMAT,
		apiSubmitEnabled: httpSubmit.enabled && !!httpSubmit.apiKey,
		apiSubmitUrl: `${url.origin}/api/matches`,
		apiDraftUrl: `${url.origin}/api/matches/draft`,
		apiSubmitKey: httpSubmit.apiKey,
	};
}

/** @type {import('./$types').Actions} */
export const actions = {
	logMatch: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'Not authenticated' });
		if (!canSubmitMatches(locals.user)) {
			return fail(403, {
				error: 'Your account is pending admin approval. You cannot submit matches yet.',
			});
		}

		const data = await request.formData();
		const whiteId = data.get('whiteId')?.toString();
		const blackId = data.get('blackId')?.toString();
		const resultRaw = data.get('result')?.toString();
		const notation = data.get('notation')?.toString() ?? '';
		const timeFormatRaw = data.get('timeFormat')?.toString();
		const timeFormat = typeof timeFormatRaw === 'string' ? timeFormatRaw.trim() : '';

		if (!whiteId || !blackId || !resultRaw) {
			return fail(400, { error: 'Missing required fields' });
		}
		if (whiteId === blackId) {
			return fail(400, { error: 'Players must be different' });
		}
		if (!['white', 'black', 'draw'].includes(resultRaw)) {
			return fail(400, { error: 'Invalid result' });
		}
		if (!parseTimeFormatValue(timeFormat)) {
			return fail(400, { error: 'Select a valid time format' });
		}
		const result = /** @type {'white' | 'black' | 'draw'} */ (resultRaw);

		try {
			const { matchId, status } = await createMatch({
				whitePlayerId: whiteId,
				blackPlayerId: blackId,
				result,
				notation,
				timeFormat,
				reportedBy: locals.user._id,
				reporterName: locals.user.name,
			});

			return {
				success: true,
				matchId,
				status,
				message:
					status === 'approved'
						? 'Match logged and ratings updated!'
						: 'Match submitted — pending admin approval.',
			};
		} catch (err) {
			if (err && typeof err === 'object' && 'status' in err && 'message' in err) {
				return fail(/** @type {number} */ (err.status), {
					error: /** @type {string} */ (err.message),
				});
			}
			throw err;
		}
	},

	finalizeDraft: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'Not authenticated' });

		const draftConfig = await getDraftConfig();
		if (!canFinalizeDrafts(locals.user, draftConfig)) {
			return fail(403, { error: 'You cannot finalize board drafts.' });
		}

		const data = await request.formData();
		const draftId = data.get('draftId')?.toString();
		const whiteId = data.get('whiteId')?.toString();
		const blackId = data.get('blackId')?.toString();

		if (!draftId || !whiteId || !blackId) {
			return fail(400, { error: 'Missing required fields' });
		}
		if (whiteId === blackId) {
			return fail(400, { error: 'Players must be different' });
		}

		try {
			const { matchId, status } = await finalizeDraftMatch({
				draftId,
				whitePlayerId: whiteId,
				blackPlayerId: blackId,
				finalizedBy: locals.user._id,
				reporterName: locals.user.name,
			});

			return {
				success: true,
				matchId,
				status,
				message:
					status === 'approved'
						? 'Match logged and ratings updated!'
						: 'Match submitted — pending admin approval.',
			};
		} catch (err) {
			if (err && typeof err === 'object' && 'status' in err && 'message' in err) {
				return fail(/** @type {number} */ (err.status), {
					error: /** @type {string} */ (err.message),
				});
			}
			throw err;
		}
	},
};
