import { isAutoPromoteFirstUserEnabled } from '$lib/auto-promote-first-user.js';
import { getPlayers } from '$lib/db.js';
import { PLAYER_STATUS_MEMBER, PLAYER_STATUS_PENDING } from '$lib/player-status.js';

/** @param {string} username @param {string} name @param {string} passwordHash @param {boolean} isAdmin */
const newPlayerDoc = (username, name, passwordHash, isAdmin) => ({
	username,
	passwordHash,
	name,
	icon: '',
	avatarUrl: '',
	rating: 1200,
	isAdmin,
	status: isAdmin ? PLAYER_STATUS_MEMBER : PLAYER_STATUS_PENDING,
	stats: { wins: 0, losses: 0, draws: 0 },
	createdAt: new Date(),
});

/**
 * @param {{ username: string, name: string, passwordHash: string }} input
 * @returns {Promise<import('mongodb').ObjectId>}
 */
export const registerPlayer = async ({ username, name, passwordHash }) => {
	const players = await getPlayers();

	if (!isAutoPromoteFirstUserEnabled()) {
		const { insertedId } = await players.insertOne(
			newPlayerDoc(username, name, passwordHash, false),
		);
		return insertedId;
	}

	const session = players.db.client.startSession();

	try {
		/** @type {import('mongodb').ObjectId | undefined} */
		let insertedId;

		await session.withTransaction(async () => {
			const isFirstUser = (await players.countDocuments({}, { session })) === 0;
			const result = await players.insertOne(
				newPlayerDoc(username, name, passwordHash, isFirstUser),
				{ session },
			);
			insertedId = result.insertedId;
		});

		if (!insertedId) throw new Error('Player insert did not return an id');
		return insertedId;
	} finally {
		await session.endSession();
	}
};
