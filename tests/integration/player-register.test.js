import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { getPlayers } from '$lib/server/db.js';
import { registerPlayer } from '$lib/server/players/player-register.js';
import { closeTestDb, isMongoAvailable, resetTestDb } from '../helpers/mongo.js';
import { resetTestEnv, setTestEnv } from '../setup.js';

const mongoAvailable = await isMongoAvailable();

describe.skipIf(!mongoAvailable)('registerPlayer', () => {
	beforeAll(async () => {
		await resetTestDb();
	});

	beforeEach(async () => {
		resetTestEnv();
		await resetTestDb();
	});

	afterAll(async () => {
		await closeTestDb();
	});

	it('creates a pending non-admin player by default', async () => {
		const id = await registerPlayer({
			username: 'newbie',
			name: 'Newbie',
			passwordHash: 'hash',
		});

		const player = await getPlayers().then((players) => players.findOne({ _id: id }));
		expect(player?.username).toBe('newbie');
		expect(player?.isAdmin).toBe(false);
		expect(player?.status).toBe('pending');
		expect(player?.rating).toBe(1200);
	});

	it('promotes the first registered user when auto-promote is enabled', async () => {
		setTestEnv('AUTO_PROMOTE_FIRST_USER', 'true');

		const id = await registerPlayer({
			username: 'founder',
			name: 'Founder',
			passwordHash: 'hash',
		});

		const player = await getPlayers().then((players) => players.findOne({ _id: id }));
		expect(player?.isAdmin).toBe(true);
		expect(player?.status).toBe('member');
	});
});
