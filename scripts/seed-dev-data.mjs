#!/usr/bin/env node
/**
 * Populates local Docker dev MongoDB with an admin account, test players, and classic-game matches.
 * Idempotent: skips when the `admin` user already exists.
 * Only intended for DOCKER_DEV — invoked from docker/app-entrypoint.sh.
 */
import { randomBytes } from 'node:crypto';
import { MongoClient } from 'mongodb';
import { computeElo } from '../src/lib/chess/elo.js';
import { validateNotation } from '../src/lib/chess/notation.js';
import { parseTimeFormatValue } from '../src/lib/chess/time-control.js';
import { hashPassword } from '../src/lib/server/auth/password.js';
import { CLASSIC_GAMES } from './data/classic-games.js';

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin';
const TEST_USER_PASSWORD = 'password';
const SEED_MARKER = 'dev-docker-seed-v1';

const FIRST_NAMES = [
	'Alex',
	'Jordan',
	'Sam',
	'Taylor',
	'Morgan',
	'Casey',
	'Riley',
	'Quinn',
	'Avery',
	'Jamie',
];

const LAST_NAMES = [
	'Chen',
	'Patel',
	'Kim',
	'Okonkwo',
	'Santos',
	'Nguyen',
	'Weber',
	'Brooks',
	'Reyes',
	'Murphy',
];

const PLAYER_ICONS = ['♟️', '🏰', '👑', '🎯', '☕', '🦊', '🐢', '🧠', '⚡', '🎲'];

const getMongoUri = () =>
	process.env.MONGODB_URI?.trim() || 'mongodb://mongo:27017/?replicaSet=rs0';
const getDbName = () => process.env.MONGODB_DB_NAME?.trim() || 'chess-club';

/** @param {string} uri */
const waitForMongo = async (uri) => {
	const maxAttempts = 30;
	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		const client = new MongoClient(uri, { serverSelectionTimeoutMS: 2_000 });
		try {
			await client.connect();
			await client.db().admin().ping();
			return;
		} catch {
			if (attempt === maxAttempts) {
				throw new Error('MongoDB not reachable after 30 attempts');
			}
			await new Promise((resolve) => setTimeout(resolve, 1_000));
		} finally {
			await client.close().catch(() => {});
		}
	}
};

/** @param {import('mongodb').Db} db */
const ensureIndexes = async (db) => {
	const players = db.collection('players');
	await players.createIndex({ username: 1 }, { unique: true });
	await players.createIndex({ rating: -1 });
	await players.createIndex({ status: 1 });
	await db.collection('matches').createIndex({ whitePlayerId: 1 });
	await db.collection('matches').createIndex({ blackPlayerId: 1 });
	await db.collection('matches').createIndex({ status: 1 });
	await db.collection('matches').createIndex({ playedAt: -1 });
	await db.collection('config').updateOne(
		{ _id: 'global_settings' },
		{
			$setOnInsert: {
				_id: 'global_settings',
				honorSystemEnabled: true,
				clubName: 'Office Chess Club',
				httpSubmitEnabled: false,
				publicViewEnabled: true,
				slackWebhookEnabled: true,
			},
		},
		{ upsert: true },
	);
};

/** @template T @param {T[]} items */
const shuffle = (items) => {
	const copy = [...items];
	for (let i = copy.length - 1; i > 0; i--) {
		const j = randomBytes(1)[0] % (i + 1);
		[copy[i], copy[j]] = [copy[j], copy[i]];
	}
	return copy;
};

/** @param {number} count */
const pickTestUsers = (count) => {
	const first = shuffle(FIRST_NAMES);
	const last = shuffle(LAST_NAMES);
	const icons = shuffle(PLAYER_ICONS);
	/** @type {Array<{ username: string, name: string, icon: string }>} */
	const users = [];

	for (let i = 0; i < count; i++) {
		const f = first[i % first.length];
		const l = last[(i + 3) % last.length];
		const base = `${f}.${l}`.toLowerCase().replace(/[^a-z.]/g, '');
		users.push({
			username: `${base}${i + 1}`,
			name: `${f} ${l}`,
			icon: icons[i % icons.length],
		});
	}

	return users;
};

/**
 * @param {import('mongodb').Collection} playersCol
 * @param {import('mongodb').Collection} matchesCol
 * @param {object} input
 */
const insertApprovedMatch = async (playersCol, matchesCol, input) => {
	const { whiteId, blackId, result, notation, timeFormat, playedAt, reportedBy } = input;
	const [white, black] = await Promise.all([
		playersCol.findOne({ _id: whiteId }),
		playersCol.findOne({ _id: blackId }),
	]);
	if (!white || !black) throw new Error('Seed match player not found');

	const parsedTime = parseTimeFormatValue(timeFormat);
	if (!parsedTime) throw new Error(`Invalid time format: ${timeFormat}`);

	const eloChange = computeElo(white.rating, black.rating, result);
	const isDraw = result === 'draw';
	const winnerId = isDraw ? null : result === 'white' ? white._id : black._id;

	await matchesCol.insertOne({
		whitePlayerId: white._id,
		blackPlayerId: black._id,
		winnerId,
		isDraw,
		status: 'approved',
		eloChange,
		notation,
		timeFormat: parsedTime.value,
		timeControl: {
			baseSeconds: parsedTime.baseSeconds,
			incrementSeconds: parsedTime.incrementSeconds,
		},
		reportedBy,
		playedAt,
	});

	await Promise.all([
		playersCol.updateOne(
			{ _id: white._id },
			{
				$set: { rating: eloChange.white.after },
				$inc: {
					'stats.wins': result === 'white' ? 1 : 0,
					'stats.losses': result === 'black' ? 1 : 0,
					'stats.draws': isDraw ? 1 : 0,
				},
			},
		),
		playersCol.updateOne(
			{ _id: black._id },
			{
				$set: { rating: eloChange.black.after },
				$inc: {
					'stats.wins': result === 'black' ? 1 : 0,
					'stats.losses': result === 'white' ? 1 : 0,
					'stats.draws': isDraw ? 1 : 0,
				},
			},
		),
	]);
};

const main = async () => {
	if (process.env.DOCKER_DEV !== 'true') {
		console.log('[seed] DOCKER_DEV is not set — skipping dev seed.');
		return;
	}

	const uri = getMongoUri();
	await waitForMongo(uri);

	const client = new MongoClient(uri);
	await client.connect();
	const db = client.db(getDbName());

	try {
		await ensureIndexes(db);
		const playersCol = db.collection('players');

		if (await playersCol.findOne({ username: ADMIN_USERNAME })) {
			console.log('[seed] Dev data already present (admin exists) — skipping.');
			return;
		}

		for (const game of CLASSIC_GAMES) {
			const parsed = validateNotation(game.pgn);
			if (!parsed.ok) {
				throw new Error(`Invalid seed PGN (${game.title}): ${parsed.error}`);
			}
		}

		const adminHash = await hashPassword(ADMIN_PASSWORD);
		const testHash = await hashPassword(TEST_USER_PASSWORD);
		const now = Date.now();

		const { insertedId: adminId } = await playersCol.insertOne({
			username: ADMIN_USERNAME,
			passwordHash: adminHash,
			name: 'Admin',
			icon: '♔',
			avatarUrl: '',
			rating: 1200,
			isAdmin: true,
			status: 'member',
			theme: 'dark',
			stats: { wins: 0, losses: 0, draws: 0 },
			createdAt: new Date(now - 30 * 86_400_000),
			devSeed: SEED_MARKER,
		});

		const testUserSpecs = pickTestUsers(5);
		/** @type {import('mongodb').ObjectId[]} */
		const testUserIds = [];

		for (const [index, spec] of testUserSpecs.entries()) {
			const { insertedId } = await playersCol.insertOne({
				username: spec.username,
				passwordHash: testHash,
				name: spec.name,
				icon: spec.icon,
				avatarUrl: '',
				rating: 1180 + (index % 4) * 15,
				isAdmin: false,
				status: 'member',
				theme: index % 2 === 0 ? 'dark' : 'light',
				stats: { wins: 0, losses: 0, draws: 0 },
				createdAt: new Date(now - (20 - index) * 86_400_000),
				devSeed: SEED_MARKER,
			});
			testUserIds.push(insertedId);
		}

		const allPlayerIds = [adminId, ...testUserIds];
		const matchesCol = db.collection('matches');

		/** @type {Array<[import('mongodb').ObjectId, import('mongodb').ObjectId]>} */
		const pairings = [];
		for (let i = 0; i < CLASSIC_GAMES.length; i++) {
			const whiteIdx = i % allPlayerIds.length;
			let blackIdx = (i + 1 + (i % 3)) % allPlayerIds.length;
			if (blackIdx === whiteIdx) blackIdx = (blackIdx + 1) % allPlayerIds.length;
			pairings.push([allPlayerIds[whiteIdx], allPlayerIds[blackIdx]]);
		}

		for (const [index, game] of CLASSIC_GAMES.entries()) {
			const [whiteId, blackId] = pairings[index];
			const daysAgo = CLASSIC_GAMES.length - index;
			await insertApprovedMatch(playersCol, matchesCol, {
				whiteId,
				blackId,
				result: game.result,
				notation: game.pgn,
				timeFormat: game.timeFormat,
				playedAt: new Date(now - daysAgo * 86_400_000 - index * 3_600_000),
				reportedBy: whiteId,
			});
		}

		await db.collection('config').updateOne(
			{ _id: 'global_settings' },
			{
				$set: {
					devSeedVersion: SEED_MARKER,
					devSeededAt: new Date(),
				},
			},
		);

		console.log('[seed] Dev database seeded successfully.');
		console.log(`[seed]   Admin login:  ${ADMIN_USERNAME} / ${ADMIN_PASSWORD}`);
		console.log(
			`[seed]   Test users:   ${TEST_USER_PASSWORD} (all ${testUserSpecs.length} players)`,
		);
		for (const spec of testUserSpecs) {
			console.log(`[seed]     - ${spec.username} (${spec.name})`);
		}
		console.log(`[seed]   Matches:      ${CLASSIC_GAMES.length} approved games with PGN`);
		console.log('[seed]   App:          http://localhost:5173/login');
	} finally {
		await client.close();
	}
};

main().catch((err) => {
	console.error('[seed] Failed:', err);
	process.exit(1);
});
