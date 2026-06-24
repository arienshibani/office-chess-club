import { fail, isRedirect, redirect } from '@sveltejs/kit';
import { failFromError } from '$lib/server/actions/action-error.js';
import { setSessionCookie } from '$lib/server/auth/auth.js';
import { hashPassword, normalizeUsername, verifyPassword } from '$lib/server/auth/password.js';
import { isPublicViewEnabled } from '$lib/server/config/public-view-config.js';
import { getConfig, getPlayers } from '$lib/server/db.js';
import { registerPlayer } from '$lib/server/players/player-register.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals, url }) {
	if (locals.user) {
		const next = url.searchParams.get('next');
		redirect(302, next?.startsWith('/') ? next : '/');
	}

	const cfgCol = await getConfig();
	const config = await cfgCol.findOne(/** @type {any} */ ({ _id: 'global_settings' }));
	const clubNameRaw = typeof config?.clubName === 'string' ? config.clubName.trim() : '';

	return {
		clubName: clubNameRaw || 'Office',
		publicViewEnabled: isPublicViewEnabled(config),
	};
}

/** @type {import('./$types').Actions} */
export const actions = {
	login: async ({ request, cookies, url }) => {
		const form = await request.formData();
		const username = normalizeUsername(String(form.get('username') ?? ''));
		const password = String(form.get('password') ?? '');

		if (!username || !password) {
			return fail(400, { error: 'Username and password required.', action: 'login' });
		}

		try {
			const players = await getPlayers();
			const user = await players.findOne({ username });
			if (
				!user ||
				typeof user.passwordHash !== 'string' ||
				!(await verifyPassword(password, user.passwordHash))
			) {
				return fail(401, { error: 'Invalid username or password.', action: 'login' });
			}

			setSessionCookie(cookies, user._id.toString());
			const next = url.searchParams.get('next');
			redirect(302, next?.startsWith('/') ? next : '/');
		} catch (err) {
			if (isRedirect(err)) throw err;
			return failFromError(
				err,
				'Could not sign in — the server hit a problem. Try again in a moment.',
				{
					action: 'login',
				},
			);
		}
	},

	register: async ({ request, cookies }) => {
		const form = await request.formData();
		const username = normalizeUsername(String(form.get('username') ?? ''));
		const password = String(form.get('password') ?? '');
		const name = String(form.get('name') ?? '').trim() || username;

		if (!username || username.length < 2) {
			return fail(400, { error: 'Username must be at least 2 characters.', action: 'register' });
		}
		if (!password || password.length < 4) {
			return fail(400, { error: 'Password must be at least 4 characters.', action: 'register' });
		}

		try {
			const players = await getPlayers();
			if (await players.findOne({ username })) {
				return fail(409, { error: 'Username already taken.', action: 'register' });
			}

			const passwordHash = await hashPassword(password);
			let insertedId;
			try {
				insertedId = await registerPlayer({ username, name, passwordHash });
			} catch (err) {
				const maybeCode = /** @type {{ code?: number }} */ (err).code;
				if (maybeCode === 11000) {
					return fail(409, { error: 'Username already taken.', action: 'register' });
				}
				return failFromError(
					err,
					'Could not create your account — the server hit a problem. Try again in a moment.',
					{ action: 'register' },
				);
			}
			setSessionCookie(cookies, insertedId.toString());
			redirect(302, '/');
		} catch (err) {
			if (isRedirect(err)) throw err;
			return failFromError(
				err,
				'Could not create your account — the server hit a problem. Try again in a moment.',
				{ action: 'register' },
			);
		}
	},
};
