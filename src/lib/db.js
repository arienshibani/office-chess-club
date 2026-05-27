import { MongoClient, ObjectId } from 'mongodb';
import { env } from '$env/dynamic/private';

const globalWithMongo = /** @type {typeof globalThis & { _mongoClient?: MongoClient }} */ (globalThis);

const getMongoUri = () => {
	const uri = env.MONGODB_URI?.trim();
	if (!uri) throw new Error('MONGODB_URI is not set');
	return uri;
};

const getDbName = () => env.MONGODB_DB_NAME?.trim() || 'chess-club';

/** @returns {Promise<MongoClient>} */
async function getClient() {
	if (globalWithMongo._mongoClient) return globalWithMongo._mongoClient;

	const client = new MongoClient(getMongoUri(), {
		maxPoolSize: 10,
		serverSelectionTimeoutMS: 10_000,
		connectTimeoutMS: 10_000
	});
	await client.connect();
	globalWithMongo._mongoClient = client;
	return client;
}

/** @returns {Promise<import('mongodb').Db>} */
export async function getDb() {
	const c = await getClient();
	return c.db(getDbName());
}

/** @returns {Promise<import('mongodb').Collection>} */
export async function getPlayers() {
	const db = await getDb();
	return db.collection('players');
}

/** @returns {Promise<import('mongodb').Collection>} */
export async function getMatches() {
	const db = await getDb();
	return db.collection('matches');
}

/** @returns {Promise<import('mongodb').Collection>} */
export async function getConfig() {
	const db = await getDb();
	return db.collection('config');
}

export async function ensureIndexes() {
	const db = await getDb();
	await db.collection('players').createIndex({ slackId: 1 }, { unique: true });
	await db.collection('players').createIndex({ rating: -1 });
	await db.collection('matches').createIndex({ whitePlayerId: 1 });
	await db.collection('matches').createIndex({ blackPlayerId: 1 });
	await db.collection('matches').createIndex({ status: 1 });
	await db.collection('matches').createIndex({ playedAt: -1 });

	await db.collection('config').updateOne(
		/** @type {any} */ ({ _id: 'global_settings' }),
		{ $setOnInsert: /** @type {any} */ ({ _id: 'global_settings', honorSystemEnabled: true }) },
		{ upsert: true }
	);
}

export { ObjectId };
