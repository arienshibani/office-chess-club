import { getPlayers, getMatches, getConfig, ObjectId } from '$lib/db.js';
import { computeElo } from '$lib/elo.js';
import { fail } from '@sveltejs/kit';
import { notifyMatchApproved, notifyPendingMatch } from '$lib/slack.js';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
	const [playersCol, matchesCol, cfgCol] = await Promise.all([
		getPlayers(),
		getMatches(),
		getConfig()
	]);

	const [leaderboard, recentMatches, config] = await Promise.all([
		playersCol.find({}).sort({ rating: -1 }).toArray(),
		matchesCol.find({}).sort({ playedAt: -1 }).limit(20).toArray(),
		cfgCol.findOne(/** @type {any} */ ({ _id: 'global_settings' }))
	]);

	const playerIds = [
		...new Set(
			recentMatches.flatMap((m) => [
				m.whitePlayerId.toString(),
				m.blackPlayerId.toString()
			])
		)
	];

	const playerDocs = playerIds.length
		? await playersCol.find({ _id: { $in: playerIds.map((id) => new ObjectId(id)) } }).toArray()
		: [];

	/** @type {Record<string, any>} */
	const playerMap = Object.fromEntries(playerDocs.map((p) => [p._id.toString(), p]));

	const enrichedMatches = recentMatches.map((m) => ({
		_id: m._id.toString(),
		isDraw: m.isDraw,
		status: m.status,
		eloChange: m.eloChange,
		playedAt: m.playedAt,
		whitePlayerId: m.whitePlayerId.toString(),
		blackPlayerId: m.blackPlayerId.toString(),
		winnerId: m.winnerId?.toString() ?? null,
		whiteName: playerMap[m.whitePlayerId.toString()]?.name ?? 'Unknown',
		blackName: playerMap[m.blackPlayerId.toString()]?.name ?? 'Unknown',
		whiteAvatar: playerMap[m.whitePlayerId.toString()]?.avatarUrl ?? '',
		blackAvatar: playerMap[m.blackPlayerId.toString()]?.avatarUrl ?? ''
	}));

	return {
		leaderboard: leaderboard.map((p) => ({
			_id: p._id.toString(),
			name: p.name,
			avatarUrl: p.avatarUrl ?? '',
			rating: p.rating,
			stats: p.stats
		})),
		recentMatches: enrichedMatches,
		honorSystemEnabled: config?.honorSystemEnabled ?? true,
		allPlayers: leaderboard.map((p) => ({ _id: p._id.toString(), name: p.name, rating: p.rating }))
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
		const notation = data.get('notation')?.toString() || null;

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

		const [playersCol, matchesCol, cfgCol] = await Promise.all([
			getPlayers(),
			getMatches(),
			getConfig()
		]);

		const [white, black, config] = await Promise.all([
			playersCol.findOne({ _id: new ObjectId(whiteId) }),
			playersCol.findOne({ _id: new ObjectId(blackId) }),
			cfgCol.findOne(/** @type {any} */ ({ _id: 'global_settings' }))
		]);

		if (!white || !black) return fail(400, { error: 'Player not found' });

		const eloChange = computeElo(white.rating, black.rating, result);
		const isDraw = result === 'draw';
		const winnerId = isDraw ? null : result === 'white' ? white._id : black._id;

		const honorSystem = config?.honorSystemEnabled ?? true;
		const status = honorSystem ? 'approved' : 'pending';

		const match = {
			whitePlayerId: white._id,
			blackPlayerId: black._id,
			winnerId,
			isDraw,
			status,
			eloChange,
			notation: notation || null,
			reportedBy: new ObjectId(locals.user._id),
			playedAt: new Date()
		};

		const inserted = await matchesCol.insertOne(match);
		const matchId = inserted.insertedId.toString();

		if (honorSystem) {
			await Promise.all([
				playersCol.updateOne(
					{ _id: white._id },
					{
						$set: { rating: eloChange.white.after },
						$inc: {
							'stats.wins': result === 'white' ? 1 : 0,
							'stats.losses': result === 'black' ? 1 : 0,
							'stats.draws': isDraw ? 1 : 0
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
							'stats.draws': isDraw ? 1 : 0
						}
					}
				)
			]);

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
		} else {
			await notifyPendingMatch({
				reporterName: locals.user.name,
				opponentName: locals.user._id === whiteId ? black.name : white.name,
				matchId
			});
		}

		return { success: true, matchId, status };
	}
};
