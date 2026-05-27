import { env } from '$env/dynamic/private';

/** Single source of truth for OAuth redirect (must match Slack app settings). */
export const getSlackRedirectUri = () => {
	const explicit = env.SLACK_REDIRECT_URI?.trim();
	if (explicit) return explicit.replace(/\/$/, '');

	const origin = env.ORIGIN?.trim().replace(/\/$/, '');
	if (!origin) {
		throw new Error('Set ORIGIN or SLACK_REDIRECT_URI in environment variables');
	}
	return `${origin}/auth/callback/slack`;
};

export const getSlackClientId = () => {
	const id = env.SLACK_CLIENT_ID?.trim();
	if (!id) throw new Error('SLACK_CLIENT_ID is not set');
	return id;
};
