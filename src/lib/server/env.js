import { env } from '$env/dynamic/private';

/** @returns {string} */
export const getSessionSecret = () => {
	const secret = env.SESSION_SECRET?.trim();
	if (!secret) {
		throw new Error('SESSION_SECRET is not set');
	}
	return secret;
};

/** @returns {string} */
export const getOrigin = () => {
	const explicit = env.ORIGIN?.trim();
	if (explicit) {
		return explicit.replace(/\/$/, '');
	}

	const vercelUrl = env.VERCEL_URL?.trim();
	if (vercelUrl) {
		return `https://${vercelUrl.replace(/\/$/, '')}`;
	}

	return 'http://localhost:5173';
};

/** @returns {string} */
export const getEnvDiscordWebhookUrl = () =>
	typeof env.DISCORD_WEBHOOK_URL === 'string' ? env.DISCORD_WEBHOOK_URL.trim() : '';

/** @returns {string} */
export const getEnvSlackWebhookUrl = () =>
	typeof env.SLACK_WEBHOOK_URL === 'string' ? env.SLACK_WEBHOOK_URL.trim() : '';
