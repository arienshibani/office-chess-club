import { createHash } from 'crypto';
import {
	getSlackClientId,
	getSlackClientSecret,
	getSlackRedirectUri
} from '$lib/slack-config.js';
import { debugLog } from '$lib/debug-log.js';

/** @param {string} jwt */
export const decodeJwtPayload = (jwt) => {
	const payload = jwt.split('.')[1];
	return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
};

/** @typedef {{ endpoint: string, variant: string, ok: boolean, error?: string, error_description?: string, warning?: string }} TokenAttempt */

/** @param {string} endpoint @param {URLSearchParams} body */
const postToken = async (endpoint, body) => {
	const res = await fetch(`https://slack.com/api/${endpoint}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body
	});
	return /** @type {Record<string, unknown>} */ (await res.json());
};

/** @param {string} endpoint @param {string} variant @param {Record<string, unknown>} data */
const attemptFrom = (endpoint, variant, data) => ({
	endpoint,
	variant,
	ok: Boolean(data.ok),
	error: typeof data.error === 'string' ? data.error : undefined,
	error_description:
		typeof data.error_description === 'string' ? data.error_description : undefined,
	warning: typeof data.warning === 'string' ? data.warning : undefined
});

/**
 * @param {{ code: string, codeVerifier: string, codeChallenge?: string }} args
 */
export const exchangeSlackUserToken = async ({ code, codeVerifier, codeChallenge }) => {
	const redirectUri = getSlackRedirectUri();
	const clientId = getSlackClientId();
	const clientSecret = getSlackClientSecret();
	/** @type {TokenAttempt[]} */
	const attempts = [];

	const derivedChallenge = createHash('sha256').update(codeVerifier).digest('base64url');
	const pkceSelfCheck = codeChallenge ? derivedChallenge === codeChallenge : true;

	// #region agent log
	debugLog({
		hypothesisId: 'H5',
		location: 'slack-token.js:exchangeSlackUserToken',
		message: 'token_exchange_start',
		data: {
			redirectUri,
			clientIdSuffix: clientId.slice(-6),
			codeLen: code.length,
			verifierLen: codeVerifier.length,
			pkceSelfCheck,
			derivedChallengePrefix: derivedChallenge.slice(0, 8)
		}
	});
	// #endregion

	const base = {
		client_id: clientId,
		code,
		redirect_uri: redirectUri,
		grant_type: 'authorization_code',
		code_verifier: codeVerifier
	};

	const tryExchange = async (endpoint, variant, body) => {
		const data = await postToken(endpoint, body);
		const attempt = attemptFrom(endpoint, variant, data);
		attempts.push(attempt);
		// #region agent log
		debugLog({
			hypothesisId: 'H3',
			location: 'slack-token.js:tryExchange',
			message: 'token_attempt_result',
			data: { endpoint, variant, ok: attempt.ok, error: attempt.error }
		});
		// #endregion
		if (data.ok) return { ok: true, data };
		return null;
	};

	// Pairs with oauth/v2/authorize?openid_connect=1
	let result = await tryExchange('oauth.v2.user.access', 'pkce_no_secret', new URLSearchParams(base));
	if (result) return { ok: true, data: result.data };

	result = await tryExchange(
		'oauth.v2.user.access',
		'with_secret',
		new URLSearchParams({ ...Object.fromEntries(base), client_secret: clientSecret })
	);
	if (result) return { ok: true, data: result.data };

	result = await tryExchange(
		'openid.connect.token',
		'with_secret',
		new URLSearchParams({ ...base, client_secret: clientSecret })
	);
	if (result) return { ok: true, data: result.data };

	result = await tryExchange('openid.connect.token', 'pkce_no_secret', new URLSearchParams(base));
	if (result) return { ok: true, data: result.data };

	return { ok: false, redirectUri, attempts, pkceSelfCheck };
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
