import { Chess } from 'chess.js';
import { detectNotationType } from '$lib/chess/notation.js';
import { getPlayers } from '$lib/server/db.js';

/** @param {import('mongodb').ObjectId} whiteId @param {import('mongodb').ObjectId} blackId @param {string} userId */
const isMatchParticipant = (whiteId, blackId, userId) =>
	whiteId.toString() === userId || blackId.toString() === userId;

/** @param {import('mongodb').Document} match */
export const hasReplayablePgn = (match) => {
	const notation = match.notation;
	if (!notation || typeof notation !== 'string' || detectNotationType(notation) !== 'pgn') {
		return false;
	}
	try {
		const chess = new Chess();
		chess.loadPgn(notation);
		return chess.history().length > 0;
	} catch {
		return false;
	}
};

/** @param {import('mongodb').Document} match */
const serializeMatch = (match) => ({
	_id: match._id.toString(),
	isDraw: match.isDraw,
	status: match.status,
	eloChange: match.eloChange,
	notation: match.notation ?? null,
	timeFormat: typeof match.timeFormat === 'string' ? match.timeFormat : null,
	timeControl:
		match.timeControl &&
		typeof match.timeControl.baseSeconds === 'number' &&
		typeof match.timeControl.incrementSeconds === 'number'
			? {
					baseSeconds: match.timeControl.baseSeconds,
					incrementSeconds: match.timeControl.incrementSeconds,
				}
			: null,
	playedAt: match.playedAt,
	winnerId: match.winnerId?.toString() ?? null,
	whitePlayerId: match.whitePlayerId?.toString() ?? null,
	blackPlayerId: match.blackPlayerId?.toString() ?? null,
	draftResult: typeof match.draftResult === 'string' ? match.draftResult : null,
});

/** @param {import('mongodb').Document | null | undefined} player */
const serializePlayer = (player) =>
	player
		? {
				_id: player._id.toString(),
				name: player.name,
				icon: typeof player.icon === 'string' ? player.icon : '',
				avatarUrl: player.avatarUrl,
				rating: player.rating,
			}
		: null;

/**
 * @param {import('mongodb').Document} match
 * @param {{ _id?: string, isAdmin?: boolean } | null | undefined} user
 */
export const buildMatchReviewData = async (match, user) => {
	const playersCol = await getPlayers();
	const [white, black] = await Promise.all([
		match.whitePlayerId ? playersCol.findOne({ _id: match.whitePlayerId }) : null,
		match.blackPlayerId ? playersCol.findOne({ _id: match.blackPlayerId }) : null,
	]);

	const userId = user?._id ?? '';
	const canEditNotation =
		!!match.whitePlayerId &&
		!!match.blackPlayerId &&
		!!userId &&
		isMatchParticipant(match.whitePlayerId, match.blackPlayerId, userId);

	return {
		match: serializeMatch(match),
		white: serializePlayer(white),
		black: serializePlayer(black),
		canEditNotation,
		canEditTimeFormat: canEditNotation || !!user?.isAdmin,
		isAdmin: !!user?.isAdmin,
	};
};

/** @param {import('mongodb').Collection} matchesCol */
export const pickLatestFeaturedMatch = async (matchesCol) => {
	const candidates = await matchesCol
		.find({
			status: 'approved',
			notation: { $exists: true, $type: 'string', $ne: '' },
		})
		.sort({ playedAt: -1 })
		.limit(25)
		.toArray();

	return candidates.find(hasReplayablePgn) ?? null;
};
