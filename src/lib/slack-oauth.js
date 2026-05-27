import { randomBytes } from 'crypto';
import { createPkcePair } from '$lib/pkce.js';
import { getSlackClientId, getSlackRedirectUri } from '$lib/slack-config.js';

export const oauthCookieOpts = {
	path: '/',
	httpOnly: true,
	maxAge: 300,
	sameSite: /** @type {'lax'} */ ('lax'),
	secure: import.meta.env.PROD
};

/** @param {import('@sveltejs/kit').Cookies} cookies */
export const beginSlackOAuth = (cookies) => {
	const state = randomBytes(16).toString('hex');
	const nonce = randomBytes(16).toString('hex');
	const { codeVerifier, codeChallenge } = createPkcePair();

	cookies.set('oauth_state', state, oauthCookieOpts);
	cookies.set('oauth_nonce', nonce, oauthCookieOpts);
	cookies.set('oauth_code_verifier', codeVerifier, oauthCookieOpts);

	const params = new URLSearchParams({
		client_id: getSlackClientId(),
		user_scope: 'openid profile',
		redirect_uri: getSlackRedirectUri(),
		response_type: 'code',
		openid_connect: '1',
		state,
		nonce,
		code_challenge: codeChallenge,
		code_challenge_method: 'S256'
	});

	return `https://slack.com/oauth/v2/authorize?${params}`;
};
