import { redirect } from '@sveltejs/kit';
import { getSlackRedirectUri } from '$lib/slack-config.js';
import { getPlayers } from '$lib/db.js';
import { createSessionToken, COOKIE_NAME, MAX_AGE } from '$lib/session.js';
import { exchangeSlackUserToken, identityFromTokenResponse } from '$lib/slack-token.js';

/** @param {Record<string, string | undefined>} fields */
const logOAuth = (event, fields) => {
	console.error(`[slack-oauth] ${event}`, JSON.stringify(fields));
};

/** @type {import('./$types').RequestHandler} */
export async function GET({ url, cookies }) {
	const slackError = url.searchParams.get('error');
	if (slackError) {
		logOAuth('slack_redirect_error', { error: slackError });
		redirect(302, `/login?error=${encodeURIComponent(slackError)}`);
	}

	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = cookies.get('oauth_state');
	const codeVerifier = cookies.get('oauth_code_verifier');

	let redirectUri = '';
	try {
		redirectUri = getSlackRedirectUri();
	} catch (err) {
		const msg = err instanceof Error ? err.message : 'config_error';
		logOAuth('config_error', { message: msg });
		redirect(302, `/login?error=${encodeURIComponent(msg)}`);
	}

	cookies.delete('oauth_state', { path: '/' });
	cookies.delete('oauth_nonce', { path: '/' });
	cookies.delete('oauth_code_verifier', { path: '/' });

	if (!code || !state || state !== storedState || !codeVerifier) {
		logOAuth('state_mismatch', {
			hasCode: Boolean(code),
			hasState: Boolean(state),
			stateMatch: state === storedState,
			hasCodeVerifier: Boolean(codeVerifier),
			redirectUri
		});
		redirect(302, '/login?error=state_mismatch');
	}

	let exchangeResult;
	try {
		exchangeResult = await exchangeSlackUserToken({ code, codeVerifier });
	} catch (err) {
		const msg = err instanceof Error ? err.message : 'config_error';
		logOAuth('exchange_throw', { message: msg, redirectUri });
		redirect(302, `/login?error=${encodeURIComponent(msg)}`);
	}

	if (!exchangeResult.ok) {
		const primary =
			exchangeResult.attempts.find((a) => a.error && a.error !== 'internal_error') ??
			exchangeResult.attempts.at(-1);
		const detail = primary?.error ?? 'oauth_failed';

		logOAuth('token_exchange_failed', {
			redirectUri,
			attempts: exchangeResult.attempts
		});

		const params = new URLSearchParams({
			error: detail,
			redirect_uri: redirectUri,
			debug: JSON.stringify(exchangeResult.attempts)
		});
		if (primary?.error_description) params.set('desc', primary.error_description);

		redirect(302, `/login?${params}`);
	}

	const tokenData = exchangeResult.data;
	logOAuth('token_exchange_ok', {
		redirectUri,
		hasIdToken: Boolean(tokenData.id_token),
		hasAccessToken: Boolean(tokenData.access_token)
	});

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
		} else {
			logOAuth('userinfo_failed', {
				error: profile.error,
				error_description: profile.error_description
			});
		}
	}

	if (!identity?.slackId) {
		logOAuth('identity_failed', { tokenKeys: Object.keys(tokenData) });
		redirect(302, '/login?error=identity_failed');
	}

	try {
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

		if (!result) {
			logOAuth('upsert_failed', { slackId: identity.slackId });
			redirect(302, '/login?error=upsert_failed');
		}

		cookies.set(COOKIE_NAME, createSessionToken(result._id.toString()), {
			path: '/',
			httpOnly: true,
			secure: import.meta.env.PROD,
			sameSite: 'lax',
			maxAge: MAX_AGE
		});

		logOAuth('login_success', { slackId: identity.slackId, playerId: result._id.toString() });
		redirect(302, '/');
	} catch (err) {
		const message = err instanceof Error ? err.message : 'db_error';
		logOAuth('db_error', { message, slackId: identity.slackId });
		redirect(302, `/login?error=db_error&desc=${encodeURIComponent(message)}`);
	}
}
