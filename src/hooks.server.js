import { getPlayers, ObjectId, ensureIndexes } from '$lib/db.js';
import { verifySessionToken, COOKIE_NAME } from '$lib/session.js';

let indexesEnsured = false;

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	if (!indexesEnsured) {
		await ensureIndexes();
		indexesEnsured = true;
	}

	const token = event.cookies.get(COOKIE_NAME);
	event.locals.user = null;

	if (token) {
		const userId = verifySessionToken(token);
		if (userId) {
			try {
				const players = await getPlayers();
				const user = await players.findOne({ _id: new ObjectId(userId) });
				if (user) {
					event.locals.user = {
						_id: user._id.toString(),
						slackId: user.slackId,
						name: user.name,
						avatarUrl: user.avatarUrl,
						rating: user.rating,
						isAdmin: user.isAdmin,
						stats: user.stats
					};
				}
			} catch {
				// invalid ObjectId or DB error — clear session
				event.cookies.delete(COOKIE_NAME, { path: '/' });
			}
		}
	}

	return resolve(event);
}
