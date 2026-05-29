import { getMatches, getPlayers, ObjectId } from '$lib/db.js';
import { deleteMatchById } from '$lib/match-delete.js';
import { hashPassword } from '$lib/password.js';

export const DEFAULT_RATING = 1200;

/**
 * @param {number} status
 * @param {string} message
 */
const createHttpError = (status, message) => ({ status, message });

/**
 * @param {string} userId
 * @param {string} actingAdminId
 */
export const deleteUserById = async (userId, actingAdminId) => {
	if (userId === actingAdminId) {
		throw createHttpError(400, 'You cannot delete your own account.');
	}

	let oid;
	try {
		oid = new ObjectId(userId);
	} catch {
		throw createHttpError(400, 'Invalid user ID.');
	}

	const [playersCol, matchesCol] = await Promise.all([getPlayers(), getMatches()]);
	const player = await playersCol.findOne({ _id: oid });
	if (!player) {
		throw createHttpError(404, 'User not found.');
	}

	if (player.isAdmin) {
		const adminCount = await playersCol.countDocuments({ isAdmin: true });
		if (adminCount <= 1) {
			throw createHttpError(400, 'Cannot delete the only admin account.');
		}
	}

	const matches = await matchesCol
		.find({ $or: [{ whitePlayerId: oid }, { blackPlayerId: oid }] })
		.sort({ playedAt: -1 })
		.toArray();

	for (const match of matches) {
		await deleteMatchById(match._id.toString());
	}

	const { deletedCount } = await playersCol.deleteOne({ _id: oid });
	if (deletedCount !== 1) {
		throw createHttpError(404, 'User not found.');
	}
};

/**
 * @param {string} userId
 * @param {string} newPassword
 */
export const resetUserPasswordById = async (userId, newPassword) => {
	if (!newPassword || newPassword.length < 4) {
		throw createHttpError(400, 'Password must be at least 4 characters.');
	}

	let oid;
	try {
		oid = new ObjectId(userId);
	} catch {
		throw createHttpError(400, 'Invalid user ID.');
	}

	const playersCol = await getPlayers();
	const player = await playersCol.findOne({ _id: oid });
	if (!player) {
		throw createHttpError(404, 'User not found.');
	}

	const passwordHash = await hashPassword(newPassword);
	await playersCol.updateOne({ _id: oid }, { $set: { passwordHash } });
};

export const resetLadder = async () => {
	const [matchesCol, playersCol] = await Promise.all([getMatches(), getPlayers()]);

	await matchesCol.deleteMany({});
	await playersCol.updateMany(
		{},
		{
			$set: {
				rating: DEFAULT_RATING,
				stats: { wins: 0, losses: 0, draws: 0 }
			}
		}
	);
};
