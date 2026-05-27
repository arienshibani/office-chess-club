import { createPkcePair } from '$lib/pkce.js';
import { getSlackClientId, getSlackRedirectUri } from '$lib/slack-config.js';
import { createOAuthState } from '$lib/slack-oauth-state.js';

export const oauthCookieOpts = {
	path: '/',
	httpOnly: true,
	maxAge: 300,
	sameSite: /** @type {'lax'} */ ('lax'),
	secure: import.meta.env.PROD
};

/** @param {import('@sveltejs/kit').Cookies} cookies */
export const beginSlackOAuth = (cookies) => {
	const { codeVerifier, codeChallenge } = createPkcePair();
	const { state, nonce } = createOAuthState(codeVerifier, codeChallenge);
	const redirectUri = getSlackRedirectUri();

	cookies.set('oauth_nonce', nonce, oauthCookieOpts);

	const params = new URLSearchParams({
		client_id: getSlackClientId(),
		scope: 'openid profile email',
		redirect_uri: redirectUri,
		response_type: 'code',
		state,
		nonce,
		code_challenge: codeChallenge,
		code_challenge_method: 'S256'
	});

	return `https://slack.com/openid/connect/authorize?${params}`;
};
