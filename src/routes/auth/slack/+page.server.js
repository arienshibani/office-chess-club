import { redirect } from '@sveltejs/kit';
import { beginSlackOAuth } from '$lib/slack-oauth.js';

/** @type {import('./$types').PageServerLoad} */
export function load({ cookies }) {
	redirect(302, beginSlackOAuth(cookies));
}
