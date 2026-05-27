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

/** @typedef {{ endpoint: string, variant: string, ok: boolean, error?: string, error_description?: string, warning?: string }} TokenAttempt */

/** @param {URLSearchParams} body */
const postOpenIdToken = async (body) => {
	const res = await fetch('https://slack.com/api/openid.connect.token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body
	});
	return /** @type {Record<string, unknown>} */ (await res.json());
};

/** @param {Record<string, unknown>} data */
const attemptFrom = (variant, data) => ({
	endpoint: 'openid.connect.token',
	variant,
	ok: Boolean(data.ok),
	error: typeof data.error === 'string' ? data.error : undefined,
	error_description:
		typeof data.error_description === 'string' ? data.error_description : undefined,
	warning: typeof data.warning === 'string' ? data.warning : undefined
});

/**
 * Sign in with Slack token exchange (PKCE required).
 * @param {{ code: string, codeVerifier: string }} args
 */
export const exchangeSlackUserToken = async ({ code, codeVerifier }) => {
	const redirectUri = getSlackRedirectUri();
	const clientId = getSlackClientId();
	const clientSecret = getSlackClientSecret();
	/** @type {TokenAttempt[]} */
	const attempts = [];

	const base = {
		client_id: clientId,
		code,
		redirect_uri: redirectUri,
		grant_type: 'authorization_code',
		code_verifier: codeVerifier
	};

	// Documented OpenID token exchange (with secret).
	let data = await postOpenIdToken(
		new URLSearchParams({ ...base, client_secret: clientSecret })
	);
	attempts.push(attemptFrom('with_secret', data));
	if (data.ok) return { ok: true, data };

	// PKCE public-client style (no secret).
	data = await postOpenIdToken(new URLSearchParams(base));
	attempts.push(attemptFrom('pkce_no_secret', data));
	if (data.ok) return { ok: true, data };

	return { ok: false, redirectUri, attempts };
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
