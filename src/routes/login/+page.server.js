import { fail, redirect } from '@sveltejs/kit';
import { setSessionCookie } from '$lib/auth.js';
import { getPlayers } from '$lib/db.js';
import { hashPassword, normalizeUsername, verifyPassword } from '$lib/password.js';

/** @type {import('./$types').PageServerLoad} */
export function load({ locals, url }) {
	if (locals.user) {
		const next = url.searchParams.get('next');
		redirect(302, next?.startsWith('/') ? next : '/');
	}
}

/** @param {string} username @param {string} name @param {string} passwordHash */
const newPlayerDoc = (username, name, passwordHash) => ({
	username,
	passwordHash,
	name,
	icon: '',
	avatarUrl: '',
	rating: 1200,
	isAdmin: false,
	stats: { wins: 0, losses: 0, draws: 0 },
	createdAt: new Date()
});

/** @type {import('./$types').Actions} */
export const actions = {
	login: async ({ request, cookies, url }) => {
		const form = await request.formData();
		const username = normalizeUsername(String(form.get('username') ?? ''));
		const password = String(form.get('password') ?? '');

		if (!username || !password) {
			return fail(400, { error: 'Username and password required.', action: 'login' });
		}

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

		const players = await getPlayers();
		if (await players.findOne({ username })) {
			return fail(409, { error: 'Username already taken.', action: 'register' });
		}

		const passwordHash = await hashPassword(password);
		let insertedId;
		try {
			const inserted = await players.insertOne(newPlayerDoc(username, name, passwordHash));
			insertedId = inserted.insertedId;
		} catch (err) {
			const maybeCode = /** @type {{ code?: number }} */ (err).code;
			if (maybeCode === 11000) {
				return fail(409, { error: 'Username already taken.', action: 'register' });
			}
			throw err;
		}
		setSessionCookie(cookies, insertedId.toString());
		redirect(302, '/');
	}
};
