import { SLACK_WEBHOOK_URL as ENV_SLACK_WEBHOOK_URL } from '$env/static/private';
import { getConfig } from '$lib/db.js';

/** @param {string} url */
export const isValidSlackWebhookUrl = (url) =>
	typeof url === 'string' && /^https:\/\/hooks\.slack\.com\/services\/.+/.test(url.trim());

/** @returns {Promise<string>} */
export const getSlackWebhookUrl = async () => {
	const cfgCol = await getConfig();
	const config = await cfgCol.findOne(/** @type {any} */ ({ _id: 'global_settings' }));
	const stored =
		typeof config?.slackWebhookUrl === 'string' ? config.slackWebhookUrl.trim() : '';

	if (stored && isValidSlackWebhookUrl(stored)) {
		return stored;
	}

	const env = typeof ENV_SLACK_WEBHOOK_URL === 'string' ? ENV_SLACK_WEBHOOK_URL.trim() : '';
	if (env && isValidSlackWebhookUrl(env)) {
		return env;
	}

	return '';
};

/** @returns {Promise<{ configured: boolean, storedInDb: boolean, fromEnv: boolean }>} */
export const getSlackWebhookStatus = async () => {
	const cfgCol = await getConfig();
	const config = await cfgCol.findOne(/** @type {any} */ ({ _id: 'global_settings' }));
	const stored =
		typeof config?.slackWebhookUrl === 'string' ? config.slackWebhookUrl.trim() : '';
	const env = typeof ENV_SLACK_WEBHOOK_URL === 'string' ? ENV_SLACK_WEBHOOK_URL.trim() : '';

	const storedValid = !!(stored && isValidSlackWebhookUrl(stored));
	const envValid = !!(env && isValidSlackWebhookUrl(env));

	return {
		configured: storedValid || envValid,
		storedInDb: storedValid,
		fromEnv: !storedValid && envValid
	};
};
