import { dev } from '$app/environment';
import { fail, isRedirect } from '@sveltejs/kit';
import { errorDetails } from '$lib/format-error.js';

/**
 * @param {unknown} err
 * @param {string} message
 * @param {Record<string, unknown>} [extra]
 */
export const failFromError = (err, message, extra = {}) => {
	if (isRedirect(err)) throw err;

	const { message: details, stack } = errorDetails(err);
	console.error(`[action] ${message}:`, err);
	return fail(500, {
		error: message,
		details,
		stack: dev ? stack : undefined,
		...extra,
	});
};
