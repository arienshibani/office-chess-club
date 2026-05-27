import { redirect } from '@sveltejs/kit';
import { COOKIE_NAME } from '$lib/session.js';

/** @type {import('./$types').RequestHandler} */
export function GET({ cookies }) {
	cookies.delete(COOKIE_NAME, { path: '/' });
	redirect(302, '/login');
}
