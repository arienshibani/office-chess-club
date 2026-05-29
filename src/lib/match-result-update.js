import { getMatches, getPlayers, ObjectId } from '$lib/db.js';
import { computeElo } from '$lib/elo.js';
import { revertApprovedMatchEffects } from '$lib/match-delete.js';

/** @typedef {'white' | 'black' | 'draw'} MatchResult */

/**
 * @param {number} status
 * @param {string} message
 */
const createHttpError = (status, message) => ({ status, message });

/**
 * @param {import('mongodb').Document} match
 * @returns {MatchResult}
 */
const matchResult = (match) =>
	match.isDraw
		? 'draw'
		: match.winnerId?.toString() === match.whitePlayerId.toString()
			? 'white'
			: 'black';

/**
 * @param {import('mongodb').Collection} playersCol
 * @param {import('mongodb').Document} white
 * @param {import('mongodb').Document} black
 * @param {MatchResult} result
 * @param {{ white: { before: number; after: number }; black: { before: number; after: number } }} eloChange
 * @param {boolean} isDraw
 */
const applyApprovedMatchEffects = async (playersCol, white, black, result, eloChange, isDraw) => {
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
};

/**
 * Correct a match result. Reverts and reapplies ratings for approved matches.
 * @param {string} matchId
 * @param {MatchResult} newResult
 */
export const updateMatchResultById = async (matchId, newResult) => {
	if (!['white', 'black', 'draw'].includes(newResult)) {
		throw createHttpError(400, 'Invalid result');
	}

	let oid;
	try {
		oid = new ObjectId(matchId);
	} catch {
		throw createHttpError(400, 'Invalid match ID');
	}

	const [matchesCol, playersCol] = await Promise.all([getMatches(), getPlayers()]);
	const match = await matchesCol.findOne({ _id: oid });
	if (!match) {
		throw createHttpError(404, 'Match not found');
	}

	const oldResult = matchResult(match);
	if (oldResult === newResult) {
		throw createHttpError(400, 'That is already the recorded result.');
	}

	const [white, black] = await Promise.all([
		playersCol.findOne({ _id: match.whitePlayerId }),
		playersCol.findOne({ _id: match.blackPlayerId })
	]);
	if (!white || !black) {
		throw createHttpError(400, 'Players not found');
	}

	const isDraw = newResult === 'draw';
	const winnerId = isDraw ? null : newResult === 'white' ? white._id : black._id;

	if (match.status === 'approved') {
		await revertApprovedMatchEffects(match, playersCol);

		const baselineWhite = match.eloChange.white.before;
		const baselineBlack = match.eloChange.black.before;
		const eloChange = computeElo(baselineWhite, baselineBlack, newResult);

		await applyApprovedMatchEffects(playersCol, white, black, newResult, eloChange, isDraw);

		await matchesCol.updateOne(
			{ _id: oid },
			{ $set: { isDraw, winnerId, eloChange } }
		);
		return;
	}

	const eloChange = computeElo(white.rating, black.rating, newResult);
	await matchesCol.updateOne(
		{ _id: oid },
		{ $set: { isDraw, winnerId, eloChange } }
	);
};
