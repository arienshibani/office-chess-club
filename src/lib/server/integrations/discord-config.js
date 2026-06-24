import { DISCORD_WEBHOOK_URL as ENV_DISCORD_WEBHOOK_URL } from '$env/static/private';
import { getConfig } from '$lib/server/db.js';

/** @param {string} url */
export const isValidDiscordWebhookUrl = (url) =>
	typeof url === 'string' &&
	/^https:\/\/(discord\.com|discordapp\.com)\/api\/webhooks\/\d+\/.+/.test(url.trim());

/** @param {import('mongodb').Document | null | undefined} config */
export const isDiscordWebhookEnabled = (config) => config?.discordWebhookEnabled !== false;

/** @param {import('mongodb').Document | null | undefined} config @returns {string} */
const resolveDiscordWebhookUrl = (config) => {
	const stored =
		typeof config?.discordWebhookUrl === 'string' ? config.discordWebhookUrl.trim() : '';

	if (stored && isValidDiscordWebhookUrl(stored)) {
		return stored;
	}

	const env =
		typeof ENV_DISCORD_WEBHOOK_URL === 'string' ? ENV_DISCORD_WEBHOOK_URL.trim() : '';
	if (env && isValidDiscordWebhookUrl(env)) {
		return env;
	}

	return '';
};

/** @returns {Promise<string>} */
export const getDiscordWebhookUrl = async () => {
	const cfgCol = await getConfig();
	const config = await cfgCol.findOne(/** @type {any} */ ({ _id: 'global_settings' }));
	if (!isDiscordWebhookEnabled(config)) return '';
	return resolveDiscordWebhookUrl(config);
};

/** @returns {Promise<string>} */
export const getResolvedDiscordWebhookUrl = async () => {
	const cfgCol = await getConfig();
	const config = await cfgCol.findOne(/** @type {any} */ ({ _id: 'global_settings' }));
	return resolveDiscordWebhookUrl(config);
};

/** @returns {Promise<{ configured: boolean, enabled: boolean, storedInDb: boolean, fromEnv: boolean, url: string }>} */
export const getDiscordWebhookStatus = async () => {
	const cfgCol = await getConfig();
	const config = await cfgCol.findOne(/** @type {any} */ ({ _id: 'global_settings' }));
	const stored =
		typeof config?.discordWebhookUrl === 'string' ? config.discordWebhookUrl.trim() : '';
	const env =
		typeof ENV_DISCORD_WEBHOOK_URL === 'string' ? ENV_DISCORD_WEBHOOK_URL.trim() : '';

	const storedValid = !!(stored && isValidDiscordWebhookUrl(stored));
	const envValid = !!(env && isValidDiscordWebhookUrl(env));
	const url = resolveDiscordWebhookUrl(config);
	const enabled = isDiscordWebhookEnabled(config);

	return {
		configured: !!url,
		enabled,
		storedInDb: storedValid,
		fromEnv: !storedValid && envValid,
		url,
	};
};
