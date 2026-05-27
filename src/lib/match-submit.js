import { getPlayers, getMatches, getConfig, ObjectId } from '$lib/db.js';
import { computeElo } from '$lib/elo.js';
import { validateNotation } from '$lib/notation.js';
import { notifyMatchApproved, notifyPendingMatch } from '$lib/slack.js';

/** @typedef {'white' | 'black' | 'draw'} MatchResult */

/**
 * @param {number} status
 * @param {string} message
 */
const createHttpError = (status, message) => ({ status, message });

/**
 * @param {string} value
 * @param {string} fieldName
 */
const parseObjectId = (value, fieldName) => {
	try {
		return new ObjectId(value);
	} catch {
		throw createHttpError(400, `Invalid ${fieldName}`);
	}
};

/**
 * @param {MatchResult} result
 * @param {boolean} isDraw
 * @param {{ white: { before: number; after: number }, black: { before: number; after: number } }} eloChange
 * @param {{ name: string }} white
 * @param {{ name: string }} black
 * @param {string} matchId
 */
const notifyApprovedMatch = async (result, isDraw, eloChange, white, black, matchId) => {
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
};

/**
 * @param {object} input
 * @param {string} input.whitePlayerId
 * @param {string} input.blackPlayerId
 * @param {MatchResult} input.result
 * @param {string} input.notation
 * @param {string | null} input.reportedBy
 * @param {string} input.reporterName
 * @param {boolean} [input.requireNotation]
 */
export const createMatch = async ({
	whitePlayerId,
	blackPlayerId,
	result,
	notation,
	reportedBy,
	reporterName,
	requireNotation = false
}) => {
	if (!whitePlayerId || !blackPlayerId || !result) {
		throw createHttpError(400, 'Missing required fields');
	}
	if (whitePlayerId === blackPlayerId) {
		throw createHttpError(400, 'Players must be different');
	}
	if (!['white', 'black', 'draw'].includes(result)) {
		throw createHttpError(400, 'Invalid result');
	}

	const parsedNotation = validateNotation(notation ?? '');
	if (!parsedNotation.ok) {
		throw createHttpError(400, parsedNotation.error);
	}
	if (requireNotation && !parsedNotation.notation) {
		throw createHttpError(400, 'Notation is required');
	}

	const whiteId = parseObjectId(whitePlayerId, 'whitePlayerId');
	const blackId = parseObjectId(blackPlayerId, 'blackPlayerId');
	const reporterId = reportedBy ? parseObjectId(reportedBy, 'reportedBy') : null;

	const [playersCol, matchesCol, cfgCol] = await Promise.all([getPlayers(), getMatches(), getConfig()]);
	const [white, black, config] = await Promise.all([
		playersCol.findOne({ _id: whiteId }),
		playersCol.findOne({ _id: blackId }),
		cfgCol.findOne(/** @type {any} */ ({ _id: 'global_settings' }))
	]);

	if (!white || !black) {
		throw createHttpError(404, 'Player not found');
	}

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
		notation: parsedNotation.notation,
		reportedBy: reporterId,
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

		await notifyApprovedMatch(result, isDraw, eloChange, white, black, matchId);
	} else {
		await notifyPendingMatch({
			reporterName,
			opponentName: reporterId
				? reporterId.toString() === whitePlayerId
					? black.name
					: white.name
				: `${white.name} vs ${black.name}`,
			matchId
		});
	}

	return { matchId, status };
};
