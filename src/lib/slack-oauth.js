import { createPkcePair } from '$lib/pkce.js';
import { getSlackClientId, getSlackRedirectUri } from '$lib/slack-config.js';
import { createOAuthState } from '$lib/slack-oauth-state.js';
import { debugLog } from '$lib/debug-log.js';

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

	// H1: openid/connect/authorize redirects to oauth/v2 and DROPS code_challenge (curl-proven).
	// Use oauth/v2/authorize directly so PKCE params reach Slack.
	const params = new URLSearchParams({
		client_id: getSlackClientId(),
		user_scope: 'openid,profile',
		redirect_uri: redirectUri,
		response_type: 'code',
		openid_connect: '1',
		state,
		nonce,
		code_challenge: codeChallenge,
		code_challenge_method: 'S256'
	});

	const authorizeUrl = `https://slack.com/oauth/v2/authorize?${params}`;

	// #region agent log
	debugLog({
		hypothesisId: 'H1',
		location: 'slack-oauth.js:beginSlackOAuth',
		message: 'authorize_built',
		data: {
			endpoint: 'oauth/v2/authorize',
			redirectUri,
			hasCodeChallenge: authorizeUrl.includes('code_challenge='),
			verifierLen: codeVerifier.length,
			challengeLen: codeChallenge.length
		}
	});
	// #endregion

	return authorizeUrl;
};
