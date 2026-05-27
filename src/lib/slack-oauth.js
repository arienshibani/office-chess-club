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
	const { state, nonce } = createOAuthState(codeVerifier);

	// Backup nonce check (PKCE verifier lives in signed `state`, not a separate cookie).
	cookies.set('oauth_nonce', nonce, oauthCookieOpts);

	const params = new URLSearchParams({
		response_type: 'code',
		client_id: getSlackClientId(),
		scope: 'openid profile',
		redirect_uri: getSlackRedirectUri(),
		state,
		nonce,
		code_challenge: codeChallenge,
		code_challenge_method: 'S256'
	});

	// Canonical Sign in with Slack + PKCE (required for this app).
	return `https://slack.com/openid/connect/authorize?${params}`;
};
