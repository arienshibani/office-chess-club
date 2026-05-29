/** @typedef {'pending' | 'member'} PlayerStatus */

export const PLAYER_STATUS_PENDING = /** @type {const} */ ('pending');
export const PLAYER_STATUS_MEMBER = /** @type {const} */ ('member');

/**
 * Existing accounts without a status field are treated as members.
 * @param {unknown} status
 * @returns {PlayerStatus}
 */
export const normalizePlayerStatus = (status) =>
	status === PLAYER_STATUS_PENDING ? PLAYER_STATUS_PENDING : PLAYER_STATUS_MEMBER;

/**
 * @param {{ isAdmin?: boolean; status?: unknown } | null | undefined} user
 */
export const canSubmitMatches = (user) => {
	if (!user) return false;
	if (user.isAdmin) return true;
	return normalizePlayerStatus(user.status) === PLAYER_STATUS_MEMBER;
};
