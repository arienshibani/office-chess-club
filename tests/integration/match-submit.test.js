import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { getMatches, getPlayers, ObjectId } from '$lib/server/db.js';
import { createMatch } from '$lib/server/matches/match-submit.js';
import {
	closeTestDb,
	isMongoAvailable,
	resetTestDb,
	seedPlayer,
	setHonorSystem,
} from '../helpers/mongo.js';

const mongoAvailable = await isMongoAvailable();

describe.skipIf(!mongoAvailable)('createMatch', () => {
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

	it('approves a match and updates ratings when honor system is on', async () => {
		const white = await seedPlayer({ username: 'white', name: 'White' });
		const black = await seedPlayer({ username: 'black', name: 'Black' });

		const { matchId, status } = await createMatch({
			whitePlayerId: white._id.toString(),
			blackPlayerId: black._id.toString(),
			result: 'white',
			notation: '',
			timeFormat: '600+5',
			reportedBy: white._id.toString(),
			reporterName: white.name,
		});

		expect(status).toBe('approved');

		const [match, updatedWhite, updatedBlack] = await Promise.all([
			getMatches().then((matches) => matches.findOne({ _id: new ObjectId(matchId) })),
			getPlayers().then((players) => players.findOne({ _id: white._id })),
			getPlayers().then((players) => players.findOne({ _id: black._id })),
		]);

		expect(match?.status).toBe('approved');
		expect(updatedWhite?.rating).toBeGreaterThan(1200);
		expect(updatedBlack?.rating).toBeLessThan(1200);
		expect(updatedWhite?.stats.wins).toBe(1);
		expect(updatedBlack?.stats.losses).toBe(1);
	});

	it('creates a pending match without rating changes when honor system is off', async () => {
		await setHonorSystem(false);

		const white = await seedPlayer({ username: 'white2', name: 'White Two' });
		const black = await seedPlayer({ username: 'black2', name: 'Black Two' });

		const { status } = await createMatch({
			whitePlayerId: white._id.toString(),
			blackPlayerId: black._id.toString(),
			result: 'draw',
			notation: '',
			timeFormat: '600+5',
			reportedBy: white._id.toString(),
			reporterName: white.name,
		});

		expect(status).toBe('pending');

		const [updatedWhite, updatedBlack] = await Promise.all([
			getPlayers().then((players) => players.findOne({ _id: white._id })),
			getPlayers().then((players) => players.findOne({ _id: black._id })),
		]);

		expect(updatedWhite?.rating).toBe(1200);
		expect(updatedBlack?.rating).toBe(1200);
	});

	it('rejects matches between the same player', async () => {
		const player = await seedPlayer({ username: 'solo', name: 'Solo' });

		await expect(
			createMatch({
				whitePlayerId: player._id.toString(),
				blackPlayerId: player._id.toString(),
				result: 'white',
				notation: '',
				timeFormat: '600+5',
				reportedBy: player._id.toString(),
				reporterName: player.name,
			}),
		).rejects.toMatchObject({ status: 400, message: 'Players must be different' });
	});
});
