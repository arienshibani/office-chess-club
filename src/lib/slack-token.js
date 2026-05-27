import {
	getSlackClientId,
	getSlackClientSecret,
	getSlackRedirectUri
} from '$lib/slack-config.js';

/** @param {string} jwt */
export const decodeJwtPayload = (jwt) => {
	const payload = jwt.split('.')[1];
	return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
};

/** @param {string} endpoint @param {URLSearchParams} body */
const postToken = async (endpoint, body) => {
	const res = await fetch(`https://slack.com/api/${endpoint}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body
	});
	return res.json();
};

/**
 * Exchange code from oauth/v2/authorize?openid_connect=1 (PKCE).
 * Tries oauth.v2.user.access first (matches authorize URL), then openid.connect.token.
 * @param {{ code: string, codeVerifier: string }} args
 */
export const exchangeSlackUserToken = async ({ code, codeVerifier }) => {
	const redirectUri = getSlackRedirectUri();
	const clientId = getSlackClientId();
	const clientSecret = getSlackClientSecret();

	const userAccessBase = new URLSearchParams({
		client_id: clientId,
		code,
		redirect_uri: redirectUri,
		grant_type: 'authorization_code',
		code_verifier: codeVerifier
	});

	// PKCE public client: try without secret first
	let data = await postToken('oauth.v2.user.access', userAccessBase);
	if (data.ok) return { ...data, _endpoint: 'oauth.v2.user.access' };

	if (!data.ok) {
		data = await postToken(
			'oauth.v2.user.access',
			new URLSearchParams({ ...Object.fromEntries(userAccessBase), client_secret: clientSecret })
		);
		if (data.ok) return { ...data, _endpoint: 'oauth.v2.user.access' };
	}

	const openidBody = new URLSearchParams({
		client_id: clientId,
		client_secret: clientSecret,
		code,
		redirect_uri: redirectUri,
		grant_type: 'authorization_code',
		code_verifier: codeVerifier
	});

	data = await postToken('openid.connect.token', openidBody);
	if (data.ok) return { ...data, _endpoint: 'openid.connect.token' };

	// Return last failure (prefer explicit Slack error from user.access if present)
	return data;
};

/** @param {Record<string, unknown>} tokenData */
export const identityFromTokenResponse = (tokenData) => {
	if (typeof tokenData.id_token === 'string') {
		const claims = decodeJwtPayload(tokenData.id_token);
		return {
			slackId: claims['https://slack.com/user_id'] ?? claims.sub,
			name: claims.name ?? '',
			avatarUrl: claims['https://slack.com/user_image_72'] ?? ''
		};
	}

	const authed = tokenData.authed_user;
	if (authed && typeof authed === 'object' && 'id' in authed) {
		return {
			slackId: String(authed.id),
			name: '',
			avatarUrl: ''
		};
	}

	return null;
};
