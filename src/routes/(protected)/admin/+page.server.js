import { getMatches, getPlayers, getConfig, ObjectId } from '$lib/db.js';
import { computeElo } from '$lib/elo.js';
import { notifyMatchApproved } from '$lib/slack.js';
import { error, fail } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
	if (!locals.user?.isAdmin) error(403, 'Admin access required');

	const [matchesCol, playersCol, cfgCol] = await Promise.all([
		getMatches(),
		getPlayers(),
		getConfig()
	]);

	const [pendingMatches, config] = await Promise.all([
		matchesCol.find({ status: 'pending' }).sort({ playedAt: -1 }).toArray(),
		cfgCol.findOne(/** @type {any} */ ({ _id: 'global_settings' }))
	]);

	const playerIds = [
		...new Set(
			pendingMatches.flatMap((m) => [
				m.whitePlayerId.toString(),
				m.blackPlayerId.toString()
			])
		)
	];

	const playerDocs = playerIds.length
		? await playersCol
				.find({ _id: { $in: playerIds.map((id) => new ObjectId(id)) } })
				.toArray()
		: [];

	/** @type {Record<string, any>} */
	const playerMap = Object.fromEntries(playerDocs.map((p) => [p._id.toString(), p]));

	const enriched = pendingMatches.map((m) => ({
		_id: m._id.toString(),
		isDraw: m.isDraw,
		eloChange: m.eloChange,
		playedAt: m.playedAt,
		winnerId: m.winnerId?.toString() ?? null,
		whitePlayerId: m.whitePlayerId.toString(),
		blackPlayerId: m.blackPlayerId.toString(),
		whiteName: playerMap[m.whitePlayerId.toString()]?.name ?? 'Unknown',
		blackName: playerMap[m.blackPlayerId.toString()]?.name ?? 'Unknown',
		whiteRating: playerMap[m.whitePlayerId.toString()]?.rating ?? 0,
		blackRating: playerMap[m.blackPlayerId.toString()]?.rating ?? 0
	}));

	return {
		pendingMatches: enriched,
		honorSystemEnabled: config?.honorSystemEnabled ?? true
	};
}

/** @type {import('./$types').Actions} */
export const actions = {
	toggleHonorSystem: async ({ locals }) => {
		if (!locals.user?.isAdmin) return fail(403, { error: 'Forbidden' });

		const cfgCol = await getConfig();
		const config = await cfgCol.findOne(/** @type {any} */ ({ _id: 'global_settings' }));
		const current = config?.honorSystemEnabled ?? true;

		await cfgCol.updateOne(
			/** @type {any} */ ({ _id: 'global_settings' }),
			{ $set: { honorSystemEnabled: !current } }
		);

		return { success: true };
	},

	approveMatch: async ({ request, locals }) => {
		if (!locals.user?.isAdmin) return fail(403, { error: 'Forbidden' });

		const data = await request.formData();
		const matchId = data.get('matchId')?.toString();
		if (!matchId) return fail(400, { error: 'Missing match ID' });

		const [matchesCol, playersCol] = await Promise.all([getMatches(), getPlayers()]);

		let oid;
		try { oid = new ObjectId(matchId); } catch { return fail(400, { error: 'Invalid match ID' }); }

		const match = await matchesCol.findOne({ _id: oid, status: 'pending' });
		if (!match) return fail(404, { error: 'Match not found or already processed' });

		const [white, black] = await Promise.all([
			playersCol.findOne({ _id: match.whitePlayerId }),
			playersCol.findOne({ _id: match.blackPlayerId })
		]);
		if (!white || !black) return fail(400, { error: 'Players not found' });

		const resultRaw = match.isDraw
			? 'draw'
			: match.winnerId?.toString() === match.whitePlayerId.toString()
				? 'white'
				: 'black';
		const result = /** @type {'white' | 'black' | 'draw'} */ (resultRaw);
		const eloChange = computeElo(white.rating, black.rating, result);

		await Promise.all([
			playersCol.updateOne(
				{ _id: white._id },
				{
					$set: { rating: eloChange.white.after },
					$inc: {
						'stats.wins': result === 'white' ? 1 : 0,
						'stats.losses': result === 'black' ? 1 : 0,
						'stats.draws': match.isDraw ? 1 : 0
					}
				}
			),
			playersCol.updateOne(
				{ _id: black._id },
				{
					$set: { rating: eloChange.black.after },
					$inc: {
						'stats.wins': result === 'black' ? 1 : 0,
						'stats.losses': result === 'white' ? 1 : 0,
						'stats.draws': match.isDraw ? 1 : 0
					}
				}
			),
			matchesCol.updateOne(
				{ _id: oid },
				{ $set: { status: 'approved', eloChange } }
			)
		]);

		const isDraw = match.isDraw;
		const winnerEloChange = isDraw
			? eloChange.white.after - eloChange.white.before
			: result === 'white'
				? eloChange.white.after - eloChange.white.before
				: eloChange.black.after - eloChange.black.before;

		const loserEloChange = isDraw
			? eloChange.black.after - eloChange.black.before
			: result === 'white'
				? eloChange.black.after - eloChange.black.before
				: eloChange.white.after - eloChange.white.before;

		await notifyMatchApproved({
			winnerName: isDraw ? white.name : result === 'white' ? white.name : black.name,
			loserName: isDraw ? black.name : result === 'white' ? black.name : white.name,
			isDraw,
			winnerEloChange,
			loserEloChange,
			matchId
		});

		return { success: true };
	},

	rejectMatch: async ({ request, locals }) => {
		if (!locals.user?.isAdmin) return fail(403, { error: 'Forbidden' });

		const data = await request.formData();
		const matchId = data.get('matchId')?.toString();
		if (!matchId) return fail(400, { error: 'Missing match ID' });

		const matchesCol = await getMatches();
		let oid;
		try { oid = new ObjectId(matchId); } catch { return fail(400, { error: 'Invalid ID' }); }

		await matchesCol.deleteOne({ _id: oid, status: 'pending' });

		return { success: true };
	}
};
