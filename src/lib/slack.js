import { SLACK_WEBHOOK_URL, ORIGIN } from '$env/static/private';

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
	matchId
}) {
	const replayUrl = `${ORIGIN}/matches/${matchId}`;
	const text = isDraw
		? `🤝 *${winnerName}* and *${loserName}* drew! (${winnerEloChange >= 0 ? '+' : ''}${winnerEloChange} / ${loserEloChange >= 0 ? '+' : ''}${loserEloChange} Elo) <${replayUrl}|View match>`
		: `♟️ *${winnerName}* defeated *${loserName}*! (+${winnerEloChange} / ${loserEloChange} Elo) <${replayUrl}|Replay game here>`;

	await sendWebhook({ text });
}

/**
 * @param {object} p
 * @param {string} p.reporterName
 * @param {string} p.opponentName
 * @param {string} p.matchId
 */
export async function notifyPendingMatch({ reporterName, opponentName, matchId }) {
	const adminUrl = `${ORIGIN}/admin`;
	const text = `⏳ *${reporterName}* logged a match against *${opponentName}*. Awaiting admin verification before leaderboard updates. <${adminUrl}|Review here>`;
	await sendWebhook({ text });
}

/** @param {{ text: string }} payload */
async function sendWebhook(payload) {
	if (!SLACK_WEBHOOK_URL) return;
	try {
		await fetch(SLACK_WEBHOOK_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});
	} catch (err) {
		console.error('Slack webhook error:', err);
	}
}
