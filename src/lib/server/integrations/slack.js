import { ORIGIN } from '$env/static/private';
import {
	getResolvedSlackWebhookUrl,
	getSlackWebhookUrl,
} from '$lib/server/integrations/slack-config.js';

/**
 * @param {object} p
 * @param {string} p.winnerName
 * @param {string} p.loserName
 * @param {boolean} p.isDraw
 * @param {number} p.winnerEloChange
 * @param {number} p.loserEloChange
 * @param {string} p.matchId
 */
export async function notifyMatchApproved({
	winnerName,
	loserName,
	isDraw,
	winnerEloChange,
	loserEloChange,
	matchId,
}) {
	const replayUrl = `${ORIGIN}/matches/${matchId}`;
	const text = isDraw
		? `🤝 *${winnerName}* and *${loserName}* drew! (${winnerEloChange >= 0 ? '+' : ''}${winnerEloChange} / ${loserEloChange >= 0 ? '+' : ''}${loserEloChange} Elo) <${replayUrl}|View match>`
		: `♞ *${winnerName}* defeated *${loserName}*! (+${winnerEloChange} / ${loserEloChange} Elo) <${replayUrl}|Replay game here>`;

	await sendWebhook({ text });
}

/**
 * @param {object} p
 * @param {string} p.reporterName
 * @param {string} p.opponentName

 */
export async function notifyPendingMatch({ reporterName, opponentName }) {
	const adminUrl = `${ORIGIN}/admin`;
	const text = `⏳ *${reporterName}* logged a match against *${opponentName}*. Awaiting admin verification before leaderboard updates. <${adminUrl}|Review here>`;
	await sendWebhook({ text });
}

/** @returns {Promise<boolean>} */
export const sendSlackTestNotification = async () => {
	const webhookUrl = await getResolvedSlackWebhookUrl();
	if (!webhookUrl) return false;

	return postToSlackWebhook(webhookUrl, {
		text: '♞ Test notification from Office Chess Club — Slack is connected!',
	});
};

/** @param {string} webhookUrl @param {{ text: string }} payload @returns {Promise<boolean>} */
async function postToSlackWebhook(webhookUrl, payload) {
	try {
		const res = await fetch(webhookUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		});
		if (!res.ok) {
			console.error('Slack webhook error: HTTP', res.status);
			return false;
		}
		return true;
	} catch (err) {
		console.error('Slack webhook error:', err);
		return false;
	}
}

/** @param {{ text: string }} payload @returns {Promise<boolean>} */
async function sendWebhook(payload) {
	const webhookUrl = await getSlackWebhookUrl();
	if (!webhookUrl) return false;
	return postToSlackWebhook(webhookUrl, payload);
}
