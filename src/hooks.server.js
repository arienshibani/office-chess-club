import { dev } from '$app/environment';
import { normalizeTheme } from '$lib/client/theme.js';
import { COOKIE_NAME, verifySessionToken } from '$lib/server/auth/session.js';
import { ensureIndexes, getPlayers, ObjectId } from '$lib/server/db.js';
import { normalizePlayerStatus } from '$lib/server/players/player-status.js';
import { errorDetails } from '$lib/utils/format-error.js';

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
						username: typeof user.username === 'string' ? user.username : '',
						name: user.name,
						icon: typeof user.icon === 'string' ? user.icon : '',
						avatarUrl: user.avatarUrl ?? '',
						rating: user.rating,
						isAdmin: user.isAdmin,
						status: normalizePlayerStatus(user.status),
						stats: user.stats,
						theme: normalizeTheme(user.theme),
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

/** @type {import('@sveltejs/kit').HandleServerError} */
export function handleError({ error, status, message }) {
	const { message: details, stack } = errorDetails(error);
	console.error(`[${status}]`, error);

	if (status === 404) {
		return {
			message: "We couldn't find the page you're looking for.",
			details,
			stack: dev ? stack : undefined,
		};
	}

	return {
		message: status >= 500 ? 'The server hit an unexpected problem.' : message,
		details,
		stack: dev ? stack : undefined,
	};
}
