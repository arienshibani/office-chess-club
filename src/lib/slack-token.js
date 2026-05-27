import { createHash } from 'crypto';
import { getSlackClientId, getSlackRedirectUri } from '$lib/slack-config.js';

/** @param {string} jwt */
export const decodeJwtPayload = (jwt) => {
	const payload = jwt.split('.')[1];
	return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
};

/** @param {URLSearchParams} body */
const postOpenIdToken = async (body) => {
	const res = await fetch('https://slack.com/api/openid.connect.token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body
	});
	return /** @type {Record<string, unknown>} */ (await res.json());
};

/**
 * @param {{ code: string, codeVerifier: string, codeChallenge?: string }} args
 */
export const exchangeSlackUserToken = async ({ code, codeVerifier, codeChallenge }) => {
	const redirectUri = getSlackRedirectUri();
	const clientId = getSlackClientId();

	const derivedChallenge = createHash('sha256').update(codeVerifier).digest('base64url');
	const pkceSelfCheck = codeChallenge ? derivedChallenge === codeChallenge : true;
	if (!pkceSelfCheck) {
		return {
			ok: false,
			redirectUri,
			error: 'invalid_grant',
			error_description: 'PKCE code_verifier does not match code_challenge',
			pkceSelfCheck: false
		};
	}

	// PKCE public client: no client_secret (https://docs.slack.dev/authentication/using-pkce)
	const body = new URLSearchParams({
		client_id: clientId,
		code,
		redirect_uri: redirectUri,
		grant_type: 'authorization_code',
		code_verifier: codeVerifier
	});

	const data = await postOpenIdToken(body);

	if (data.ok) return { ok: true, data };

	const error = typeof data.error === 'string' ? data.error : 'oauth_failed';
	const error_description =
		typeof data.error_description === 'string' ? data.error_description : undefined;

	return { ok: false, redirectUri, error, error_description, pkceSelfCheck };
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

	return null;
};
