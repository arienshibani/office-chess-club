import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { env } from '$env/dynamic/private';

const getSecret = () => {
	const secret = env.SESSION_SECRET?.trim();
	if (!secret) throw new Error('SESSION_SECRET is not set');
	return secret;
};

/** @param {string} codeVerifier @param {string} codeChallenge */
export const createOAuthState = (codeVerifier, codeChallenge) => {
	const nonce = randomBytes(16).toString('hex');
	const payload = `${nonce}:${codeVerifier}:${codeChallenge}`;
	const sig = createHmac('sha256', getSecret()).update(payload).digest('hex');
	return {
		state: Buffer.from(`${payload}.${sig}`).toString('base64url'),
		nonce
	};
};

/** @param {string | null} stateParam */
export const parseOAuthState = (stateParam) => {
	if (!stateParam) return null;
	try {
		const raw = Buffer.from(stateParam, 'base64url').toString('utf8');
		const lastDot = raw.lastIndexOf('.');
		if (lastDot === -1) return null;
		const payload = raw.slice(0, lastDot);
		const sig = raw.slice(lastDot + 1);
		const expected = createHmac('sha256', getSecret()).update(payload).digest('hex');
		const sigBuf = Buffer.from(sig, 'hex');
		const expectedBuf = Buffer.from(expected, 'hex');
		if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
			return null;
		}
		const parts = payload.split(':');
		if (parts.length !== 3) return null;
		const [nonce, codeVerifier, codeChallenge] = parts;
		if (!nonce || !codeVerifier || !codeChallenge) return null;
		const derived = createHash('sha256').update(codeVerifier).digest('base64url');
		const pkceValid = derived === codeChallenge;
		return { nonce, codeVerifier, codeChallenge, pkceValid };
	} catch {
		return null;
	}
};
