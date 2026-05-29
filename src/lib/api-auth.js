import { timingSafeEqual } from 'node:crypto';
import { getHttpSubmitConfig } from '$lib/http-submit-config.js';

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
export const assertApiKey = async (request) => {
	const { enabled, apiKey } = await getHttpSubmitConfig();

	if (!enabled) {
		return { ok: false, status: 503, message: 'HTTP submission API is disabled' };
	}
	if (!apiKey) {
		return { ok: false, status: 503, message: 'HTTP submission API is not configured' };
	}

	const authorization = request.headers.get('authorization') ?? '';
	const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
	if (!token || !safeEqual(apiKey, token)) {
		return { ok: false, status: 401, message: 'Invalid API key' };
	}

	return { ok: true };
};
