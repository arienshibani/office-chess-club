import { getMatches, getPlayers, ObjectId } from '$lib/db.js';

/**
 * @param {number} status
 * @param {string} message
 */
const createHttpError = (status, message) => ({ status, message });

/**
 * Revert rating and stats for an approved match.
 * @param {import('mongodb').Document} match
 * @param {import('mongodb').Collection} playersCol
 */
export const revertApprovedMatchEffects = async (match, playersCol) => {
	if (match.status !== 'approved') return;

	const eloChange = match.eloChange;
	if (
		!eloChange ||
		typeof eloChange.white?.before !== 'number' ||
		typeof eloChange.black?.before !== 'number'
	) {
		throw createHttpError(400, 'Match is missing rating history and cannot be reverted safely.');
	}

	const result = match.isDraw
		? 'draw'
		: match.winnerId?.toString() === match.whitePlayerId.toString()
			? 'white'
			: 'black';

	await Promise.all([
		playersCol.updateOne(
			{ _id: match.whitePlayerId },
			{
				$set: { rating: eloChange.white.before },
				$inc: {
					'stats.wins': result === 'white' ? -1 : 0,
					'stats.losses': result === 'black' ? -1 : 0,
					'stats.draws': match.isDraw ? -1 : 0
				}
			}
		),
		playersCol.updateOne(
			{ _id: match.blackPlayerId },
			{
				$set: { rating: eloChange.black.before },
				$inc: {
					'stats.wins': result === 'black' ? -1 : 0,
					'stats.losses': result === 'white' ? -1 : 0,
					'stats.draws': match.isDraw ? -1 : 0
				}
			}
		)
	]);
};

/**
 * Delete a match and revert rating/stats if it was approved.
 * @param {string} matchId
 */
export const deleteMatchById = async (matchId) => {
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

	await revertApprovedMatchEffects(match, playersCol);

	const { deletedCount } = await matchesCol.deleteOne({ _id: oid });
	if (deletedCount !== 1) {
		throw createHttpError(404, 'Match not found');
	}
};
