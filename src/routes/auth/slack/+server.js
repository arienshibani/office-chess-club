import { redirect } from '@sveltejs/kit';
import { beginSlackOAuth } from '$lib/slack-oauth.js';

/** @type {import('./$types').RequestHandler} */
export function GET({ cookies }) {
	redirect(302, beginSlackOAuth(cookies));
}
