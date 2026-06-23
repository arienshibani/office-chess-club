import { COOKIE_NAME, createSessionToken, MAX_AGE } from '$lib/server/auth/session.js';

/** @param {import('@sveltejs/kit').Cookies} cookies @param {string} userId */
export const setSessionCookie = (cookies, userId) => {
	cookies.set(COOKIE_NAME, createSessionToken(userId), {
		path: '/',
		httpOnly: true,
		secure: import.meta.env.PROD,
		sameSite: 'lax',
		maxAge: MAX_AGE,
	});
};
