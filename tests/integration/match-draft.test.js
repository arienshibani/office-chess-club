import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { getMatches, getPlayers, ObjectId } from '$lib/server/db.js';
import { createDraftMatch, finalizeDraftMatch } from '$lib/server/matches/match-submit.js';
import {
	closeTestDb,
	isMongoAvailable,
	resetTestDb,
	seedPlayer,
	setHonorSystem,
	setHttpSubmit,
} from '../helpers/mongo.js';

const mongoAvailable = await isMongoAvailable();
const SAMPLE_PGN = '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6';

describe.skipIf(!mongoAvailable)('draft matches', () => {
	beforeAll(async () => {
		await resetTestDb();
	});

	beforeEach(async () => {
		await resetTestDb();
		await setHonorSystem(true);
		await setHttpSubmit(true);
	});

	afterAll(async () => {
		await closeTestDb();
	});

	it('creates a draft match without players or Elo changes', async () => {
		const { matchId, status } = await createDraftMatch({
			result: 'white',
			notation: SAMPLE_PGN,
			timeFormat: '600+5',
		});

		expect(status).toBe('draft');

		const match = await getMatches().then((matches) =>
			matches.findOne({ _id: new ObjectId(matchId) }),
		);

		expect(match?.status).toBe('draft');
		expect(match?.draftResult).toBe('white');
		expect(match?.whitePlayerId).toBeNull();
		expect(match?.blackPlayerId).toBeNull();
		expect(match?.eloChange).toBeUndefined();
	});

	it('finalizes a draft and updates ratings', async () => {
		const white = await seedPlayer({ username: 'draft-white', name: 'Draft White' });
		const black = await seedPlayer({ username: 'draft-black', name: 'Draft Black' });
		const assigner = await seedPlayer({ username: 'assigner', name: 'Assigner' });

		const { matchId } = await createDraftMatch({
			result: 'white',
			notation: SAMPLE_PGN,
			timeFormat: '600+5',
		});

		const { status } = await finalizeDraftMatch({
			draftId: matchId,
			whitePlayerId: white._id.toString(),
			blackPlayerId: black._id.toString(),
			finalizedBy: assigner._id.toString(),
			reporterName: assigner.name,
		});

		expect(status).toBe('approved');

		const [match, updatedWhite, updatedBlack] = await Promise.all([
			getMatches().then((matches) => matches.findOne({ _id: new ObjectId(matchId) })),
			getPlayers().then((players) => players.findOne({ _id: white._id })),
			getPlayers().then((players) => players.findOne({ _id: black._id })),
		]);

		expect(match?.status).toBe('approved');
		expect(match?.draftResult).toBeUndefined();
		expect(match?.finalizedBy?.toString()).toBe(assigner._id.toString());
		expect(updatedWhite?.rating).toBeGreaterThan(1200);
		expect(updatedBlack?.rating).toBeLessThan(1200);
	});

	it('rejects finalizing the same draft twice', async () => {
		const white = await seedPlayer({ username: 'w1', name: 'W1' });
		const black = await seedPlayer({ username: 'b1', name: 'B1' });
		const assigner = await seedPlayer({ username: 'a1', name: 'A1' });

		const { matchId } = await createDraftMatch({
			result: 'draw',
			notation: SAMPLE_PGN,
			timeFormat: '600+5',
		});

		await finalizeDraftMatch({
			draftId: matchId,
			whitePlayerId: white._id.toString(),
			blackPlayerId: black._id.toString(),
			finalizedBy: assigner._id.toString(),
			reporterName: assigner.name,
		});

		await expect(
			finalizeDraftMatch({
				draftId: matchId,
				whitePlayerId: white._id.toString(),
				blackPlayerId: black._id.toString(),
				finalizedBy: assigner._id.toString(),
				reporterName: assigner.name,
			}),
		).rejects.toMatchObject({ status: 409 });
	});
});
