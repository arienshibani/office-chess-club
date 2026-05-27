import { SLACK_CLIENT_ID, SLACK_CLIENT_SECRET } from '$env/static/private';

/** @param {string} jwt */
export const decodeJwtPayload = (jwt) => {
	const payload = jwt.split('.')[1];
	return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
};

/**
 * User-only token exchange (no bot install). PKCE: omit client_secret first.
 * @param {{ code: string, redirectUri: string, codeVerifier: string }} args
 */
export const exchangeSlackUserToken = async ({ code, redirectUri, codeVerifier }) => {
	const base = {
		client_id: SLACK_CLIENT_ID,
		code,
		redirect_uri: redirectUri,
		grant_type: 'authorization_code'
	};
	if (codeVerifier) base.code_verifier = codeVerifier;

	let res = await fetch('https://slack.com/api/oauth.v2.user.access', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams(base)
	});
	let data = await res.json();

	if (!data.ok && SLACK_CLIENT_SECRET) {
		res = await fetch('https://slack.com/api/oauth.v2.user.access', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({ ...base, client_secret: SLACK_CLIENT_SECRET })
		});
		data = await res.json();
	}

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
