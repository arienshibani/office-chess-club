import { env } from '$env/dynamic/private';
import { timingSafeEqual } from 'node:crypto';

/**
 * @param {string} expected
 * @param {string} actual
 */
const safeEqual = (expected, actual) => {
	const expectedBuffer = Buffer.from(expected);
	const actualBuffer = Buffer.from(actual);
	if (expectedBuffer.length !== actualBuffer.length) return false;
	return timingSafeEqual(expectedBuffer, actualBuffer);
};

/** @param {Request} request */
export const assertApiKey = (request) => {
	const configuredKey = env.SUBMIT_API_KEY?.trim();
	if (!configuredKey) {
		return { ok: false, status: 503, message: 'HTTP submission API is not configured' };
	}

	const authorization = request.headers.get('authorization') ?? '';
	const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
	if (!token || !safeEqual(configuredKey, token)) {
		return { ok: false, status: 401, message: 'Invalid API key' };
	}

	return { ok: true };
};
