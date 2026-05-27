import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { env } from '$env/dynamic/private';

const getSecret = () => {
	const secret = env.SESSION_SECRET?.trim();
	if (!secret) throw new Error('SESSION_SECRET is not set');
	return secret;
};

/** @param {string} codeVerifier */
export const createOAuthState = (codeVerifier) => {
	const nonce = randomBytes(16).toString('hex');
	const payload = `${nonce}:${codeVerifier}`;
	const sig = createHmac('sha256', getSecret()).update(payload).digest('hex');
	return {
		state: Buffer.from(`${payload}.${sig}`).toString('base64url'),
		nonce
	};
};

/** @param {string | null} stateParam @returns {{ nonce: string, codeVerifier: string } | null} */
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
		const colon = payload.indexOf(':');
		if (colon === -1) return null;
		const nonce = payload.slice(0, colon);
		const codeVerifier = payload.slice(colon + 1);
		if (!nonce || !codeVerifier) return null;
		return { nonce, codeVerifier };
	} catch {
		return null;
	}
};
