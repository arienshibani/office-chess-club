import * as discord from '$lib/server/integrations/discord.js';
import * as slack from '$lib/server/integrations/slack.js';

/**
 * @param {object} p
 * @param {string} p.winnerName
 * @param {string} p.loserName
 * @param {boolean} p.isDraw
 * @param {number} p.winnerEloChange
 * @param {number} p.loserEloChange
 * @param {string} p.matchId
 */
export const notifyMatchApproved = async (p) => {
	await Promise.allSettled([slack.notifyMatchApproved(p), discord.notifyMatchApproved(p)]);
};

/**
 * @param {object} p
 * @param {string} p.reporterName
 * @param {string} p.opponentName
 */
export const notifyPendingMatch = async (p) => {
	await Promise.allSettled([slack.notifyPendingMatch(p), discord.notifyPendingMatch(p)]);
};
