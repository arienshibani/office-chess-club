import { redirect } from '@sveltejs/kit';
import { getPlayers } from '$lib/db.js';
import { createSessionToken, COOKIE_NAME, MAX_AGE } from '$lib/session.js';
import { exchangeSlackUserToken, identityFromTokenResponse } from '$lib/slack-token.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url, cookies }) {
	const slackError = url.searchParams.get('error');
	if (slackError) {
		redirect(302, `/login?error=${encodeURIComponent(slackError)}`);
	}

	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = cookies.get('oauth_state');
	const codeVerifier = cookies.get('oauth_code_verifier');

	cookies.delete('oauth_state', { path: '/' });
	cookies.delete('oauth_nonce', { path: '/' });
	cookies.delete('oauth_code_verifier', { path: '/' });

	if (!code || !state || state !== storedState || !codeVerifier) {
		redirect(302, '/login?error=state_mismatch');
	}

	let tokenData;
	try {
		tokenData = await exchangeSlackUserToken({ code, codeVerifier });
	} catch (err) {
		const msg = err instanceof Error ? err.message : 'config_error';
		redirect(302, `/login?error=${encodeURIComponent(msg)}`);
	}

	if (!tokenData.ok) {
		const detail = typeof tokenData.error === 'string' ? tokenData.error : 'oauth_failed';
		const params = new URLSearchParams({ error: detail });
		if (typeof tokenData.error_description === 'string') {
			params.set('desc', tokenData.error_description);
		}
		redirect(302, `/login?${params}`);
	}

	let identity = identityFromTokenResponse(tokenData);

	if (identity && !identity.name && tokenData.access_token) {
		const identityRes = await fetch('https://slack.com/api/openid.connect.userInfo', {
			headers: { Authorization: `Bearer ${tokenData.access_token}` }
		});
		const profile = await identityRes.json();
		if (profile.ok) {
			identity = {
				slackId: profile['https://slack.com/user_id'] ?? identity.slackId,
				name: profile.name ?? '',
				avatarUrl: profile['https://slack.com/user_image_72'] ?? profile.picture ?? ''
			};
		}
	}

	if (!identity?.slackId) {
		redirect(302, '/login?error=identity_failed');
	}

	const players = await getPlayers();
	const result = await players.findOneAndUpdate(
		{ slackId: identity.slackId },
		{
			$setOnInsert: {
				slackId: identity.slackId,
				name: identity.name,
				avatarUrl: identity.avatarUrl,
				rating: 1200,
				isAdmin: false,
				stats: { wins: 0, losses: 0, draws: 0 },
				createdAt: new Date()
			},
			$set: { name: identity.name, avatarUrl: identity.avatarUrl }
		},
		{ upsert: true, returnDocument: 'after' }
	);

	if (!result) redirect(302, '/login?error=upsert_failed');

	cookies.set(COOKIE_NAME, createSessionToken(result._id.toString()), {
		path: '/',
		httpOnly: true,
		secure: import.meta.env.PROD,
		sameSite: 'lax',
		maxAge: MAX_AGE
	});

	redirect(302, '/');
}
