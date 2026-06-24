import { MongoClient } from 'mongodb';

const globalWithMongo = /** @type {typeof globalThis & { _mongoClient?: MongoClient }} */ (
	globalThis
);

/** @returns {Promise<boolean>} */
export const isMongoAvailable = async () => {
	const uri = process.env.MONGODB_URI?.trim();
	if (!uri) return false;

	const client = new MongoClient(uri, {
		serverSelectionTimeoutMS: 2_000,
		connectTimeoutMS: 2_000,
	});

	try {
		await client.connect();
		await client.db().admin().ping();
		return true;
	} catch {
		return false;
	} finally {
		await client.close();
	}
};

export const closeTestDb = async () => {
	const client = globalWithMongo._mongoClient;
	if (client) {
		await client.close();
		delete globalWithMongo._mongoClient;
	}
};

export const resetTestDb = async () => {
	const { ensureIndexes, getDb } = await import('$lib/server/db.js');
	const db = await getDb();
	const collections = await db.listCollections().toArray();

	await Promise.all(collections.map(({ name }) => db.collection(name).deleteMany({})));
	await ensureIndexes();
};

/**
 * @param {Record<string, unknown>} [overrides]
 */
export const seedPlayer = async (overrides = {}) => {
	const { getPlayers } = await import('$lib/server/db.js');
	const players = await getPlayers();

	const username = typeof overrides.username === 'string' ? overrides.username : 'alice';
	const doc = {
		username,
		passwordHash: '00:00',
		name: typeof overrides.name === 'string' ? overrides.name : 'Alice',
		icon: '',
		avatarUrl: '',
		rating: 1200,
		isAdmin: false,
		status: 'member',
		stats: { wins: 0, losses: 0, draws: 0 },
		createdAt: new Date(),
		...overrides,
	};

	const { insertedId } = await players.insertOne(doc);
	return { ...doc, _id: insertedId };
};

/**
 * @param {boolean} honorSystemEnabled
 */
export const setHonorSystem = async (honorSystemEnabled) => {
	const { getConfig } = await import('$lib/server/db.js');
	const config = await getConfig();
	await config.updateOne(
		/** @type {any} */ ({ _id: 'global_settings' }),
		{ $set: { honorSystemEnabled } },
		{ upsert: true },
	);
};
