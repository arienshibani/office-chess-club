import { createHmac } from 'node:crypto';
import { getSessionSecret } from '$lib/server/env.js';

const COOKIE_NAME = 'session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/** @param {string} userId */
export function createSessionToken(userId) {
	const data = `${userId}:${Date.now()}`;
	const sig = createHmac('sha256', getSessionSecret()).update(data).digest('hex');
	return Buffer.from(`${data}.${sig}`).toString('base64url');
}

/** @param {string} token @returns {string | null} userId */
export function verifySessionToken(token) {
	try {
		const decoded = Buffer.from(token, 'base64url').toString('utf8');
		const lastDot = decoded.lastIndexOf('.');
		const data = decoded.slice(0, lastDot);
		const sig = decoded.slice(lastDot + 1);
		const expected = createHmac('sha256', getSessionSecret()).update(data).digest('hex');
		if (sig !== expected) return null;
		const [userId] = data.split(':');
		return userId;
	} catch {
		return null;
	}
}

export { COOKIE_NAME, MAX_AGE };
