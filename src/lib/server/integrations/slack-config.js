import { getEnvSlackWebhookUrl } from '$lib/server/env.js';
import { getConfig } from '$lib/server/db.js';

/** @param {string} url */
export const isValidSlackWebhookUrl = (url) =>
	typeof url === 'string' && /^https:\/\/hooks\.slack\.com\/services\/.+/.test(url.trim());

/** @param {import('mongodb').Document | null | undefined} config */
export const isSlackWebhookEnabled = (config) => config?.slackWebhookEnabled !== false;

/** @param {import('mongodb').Document | null | undefined} config @returns {string} */
const resolveSlackWebhookUrl = (config) => {
	const stored = typeof config?.slackWebhookUrl === 'string' ? config.slackWebhookUrl.trim() : '';

	if (stored && isValidSlackWebhookUrl(stored)) {
		return stored;
	}

	const env = getEnvSlackWebhookUrl();
	if (env && isValidSlackWebhookUrl(env)) {
		return env;
	}

	return '';
};

/** @returns {Promise<string>} */
export const getSlackWebhookUrl = async () => {
	const cfgCol = await getConfig();
	const config = await cfgCol.findOne(/** @type {any} */ ({ _id: 'global_settings' }));
	if (!isSlackWebhookEnabled(config)) return '';
	return resolveSlackWebhookUrl(config);
};

/** @returns {Promise<string>} */
export const getResolvedSlackWebhookUrl = async () => {
	const cfgCol = await getConfig();
	const config = await cfgCol.findOne(/** @type {any} */ ({ _id: 'global_settings' }));
	return resolveSlackWebhookUrl(config);
};

/** @returns {Promise<{ configured: boolean, enabled: boolean, storedInDb: boolean, fromEnv: boolean, url: string }>} */
export const getSlackWebhookStatus = async () => {
	const cfgCol = await getConfig();
	const config = await cfgCol.findOne(/** @type {any} */ ({ _id: 'global_settings' }));
	const stored = typeof config?.slackWebhookUrl === 'string' ? config.slackWebhookUrl.trim() : '';
	const env = getEnvSlackWebhookUrl();

	const storedValid = !!(stored && isValidSlackWebhookUrl(stored));
	const envValid = !!(env && isValidSlackWebhookUrl(env));
	const url = resolveSlackWebhookUrl(config);
	const enabled = isSlackWebhookEnabled(config);

	return {
		configured: !!url,
		enabled,
		storedInDb: storedValid,
		fromEnv: !storedValid && envValid,
		url,
	};
};
