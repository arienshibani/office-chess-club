import { SLACK_CLIENT_ID, SLACK_CLIENT_SECRET } from '$env/static/private';

/** @param {string} jwt */
export const decodeJwtPayload = (jwt) => {
	const payload = jwt.split('.')[1];
	return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
};

/**
 * Exchange OAuth code from Sign in with Slack (openid_connect authorize flow).
 * @param {{ code: string, redirectUri: string, codeVerifier: string }} args
 */
export const exchangeSlackUserToken = async ({ code, redirectUri, codeVerifier }) => {
	const body = new URLSearchParams({
		client_id: SLACK_CLIENT_ID,
		client_secret: SLACK_CLIENT_SECRET,
		code,
		redirect_uri: redirectUri,
		grant_type: 'authorization_code',
		code_verifier: codeVerifier
	});

	const res = await fetch('https://slack.com/api/openid.connect.token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body
	});

	return res.json();
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
