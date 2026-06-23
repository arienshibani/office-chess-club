import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { computeElo } from '$lib/chess/elo.js';
import { getMatches, getPlayers, ObjectId } from '$lib/server/db.js';
import { deleteMatchById } from '$lib/server/matches/match-delete.js';
import { createMatch } from '$lib/server/matches/match-submit.js';
import {
	closeTestDb,
	isMongoAvailable,
	resetTestDb,
	seedPlayer,
	setHonorSystem,
} from '../helpers/mongo.js';

const mongoAvailable = await isMongoAvailable();

describe.skipIf(!mongoAvailable)('deleteMatchById', () => {
	beforeAll(async () => {
		await resetTestDb();
	});

	beforeEach(async () => {
		await resetTestDb();
		await setHonorSystem(true);
	});

	afterAll(async () => {
		await closeTestDb();
	});

	it('reverts ratings and stats when deleting an approved match', async () => {
		const white = await seedPlayer({ username: 'white', name: 'White' });
		const black = await seedPlayer({ username: 'black', name: 'Black' });

		const { matchId } = await createMatch({
			whitePlayerId: white._id.toString(),
			blackPlayerId: black._id.toString(),
			result: 'white',
			notation: '',
			timeFormat: '600+5',
			reportedBy: white._id.toString(),
			reporterName: white.name,
		});

		await deleteMatchById(matchId);

		const [match, updatedWhite, updatedBlack] = await Promise.all([
			getMatches().then((matches) => matches.findOne({ _id: new ObjectId(matchId) })),
			getPlayers().then((players) => players.findOne({ _id: white._id })),
			getPlayers().then((players) => players.findOne({ _id: black._id })),
		]);

		expect(match).toBeNull();
		expect(updatedWhite?.rating).toBe(1200);
		expect(updatedBlack?.rating).toBe(1200);
		expect(updatedWhite?.stats.wins).toBe(0);
		expect(updatedBlack?.stats.losses).toBe(0);
	});

	it('deletes pending matches without changing ratings', async () => {
		await setHonorSystem(false);

		const white = await seedPlayer({ username: 'white3', name: 'White Three' });
		const black = await seedPlayer({ username: 'black3', name: 'Black Three' });
		const eloChange = computeElo(1200, 1200, 'white');

		const matches = await getMatches();
		const { insertedId } = await matches.insertOne({
			whitePlayerId: white._id,
			blackPlayerId: black._id,
			winnerId: white._id,
			isDraw: false,
			status: 'pending',
			eloChange,
			notation: null,
			timeFormat: '600+5',
			timeControl: { baseSeconds: 600, incrementSeconds: 5 },
			reportedBy: white._id,
			playedAt: new Date(),
		});

		await deleteMatchById(insertedId.toString());

		const updatedWhite = await getPlayers().then((players) => players.findOne({ _id: white._id }));
		expect(updatedWhite?.rating).toBe(1200);
	});
});
