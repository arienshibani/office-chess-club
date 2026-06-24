import { getOrigin } from '$lib/server/env.js';
import {
	getDiscordWebhookUrl,
	getResolvedDiscordWebhookUrl,
} from '$lib/server/integrations/discord-config.js';

/** @param {string} text */
const bold = (text) => `**${text}**`;

/** @param {string} url @param {string} label */
const link = (url, label) => `[${label}](${url})`;

/**
 * @param {object} p
 * @param {string} p.winnerName
 * @param {string} p.loserName
 * @param {boolean} p.isDraw
 * @param {number} p.winnerEloChange
 * @param {number} p.loserEloChange
 * @param {string} p.matchId
 */
export const notifyMatchApproved = async ({
	winnerName,
	loserName,
	isDraw,
	winnerEloChange,
	loserEloChange,
	matchId,
}) => {
	const replayUrl = `${getOrigin()}/matches/${matchId}`;
	const content = isDraw
		? `🤝 ${bold(winnerName)} and ${bold(loserName)} drew! (${winnerEloChange >= 0 ? '+' : ''}${winnerEloChange} / ${loserEloChange >= 0 ? '+' : ''}${loserEloChange} Elo) ${link(replayUrl, 'View match')}`
		: `♞ ${bold(winnerName)} defeated ${bold(loserName)}! (+${winnerEloChange} / ${loserEloChange} Elo) ${link(replayUrl, 'Replay game here')}`;

	await sendWebhook({ content });
};

/**
 * @param {object} p
 * @param {string} p.reporterName
 * @param {string} p.opponentName
 */
export const notifyPendingMatch = async ({ reporterName, opponentName }) => {
	const adminUrl = `${getOrigin()}/admin`;
	const content = `⏳ ${bold(reporterName)} logged a match against ${bold(opponentName)}. Awaiting admin verification before leaderboard updates. ${link(adminUrl, 'Review here')}`;
	await sendWebhook({ content });
};

/** @returns {Promise<boolean>} */
export const sendDiscordTestNotification = async () => {
	const webhookUrl = await getResolvedDiscordWebhookUrl();
	if (!webhookUrl) return false;

	return postToDiscordWebhook(webhookUrl, {
		content: '♞ Test notification from Office Chess Club — Discord is connected!',
	});
};

/** @param {string} webhookUrl @param {{ content: string }} payload @returns {Promise<boolean>} */
const postToDiscordWebhook = async (webhookUrl, payload) => {
	try {
		const res = await fetch(webhookUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		});
		if (!res.ok) {
			console.error('Discord webhook error: HTTP', res.status);
			return false;
		}
		return true;
	} catch (err) {
		console.error('Discord webhook error:', err);
		return false;
	}
};

/** @param {{ content: string }} payload @returns {Promise<boolean>} */
const sendWebhook = async (payload) => {
	const webhookUrl = await getDiscordWebhookUrl();
	if (!webhookUrl) return false;
	return postToDiscordWebhook(webhookUrl, payload);
};
