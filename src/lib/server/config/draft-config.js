import { getConfig } from '$lib/server/db.js';
import { canSubmitMatches } from '$lib/server/players/player-status.js';

/** @returns {Promise<{ httpSubmitEnabled: boolean; draftAssignAdminOnly: boolean }>} */
export const getDraftConfig = async () => {
	const cfgCol = await getConfig();
	const config = await cfgCol.findOne(/** @type {any} */ ({ _id: 'global_settings' }));

	return {
		httpSubmitEnabled: config?.httpSubmitEnabled === true,
		draftAssignAdminOnly: config?.draftAssignAdminOnly === true,
	};
};

/**
 * @param {{ isAdmin?: boolean; status?: unknown } | null | undefined} user
 * @param {{ httpSubmitEnabled: boolean; draftAssignAdminOnly: boolean }} config
 */
export const canSeeDraftsTab = (user, config) => {
	if (!canSubmitMatches(user)) return false;
	if (config.draftAssignAdminOnly) return !!user?.isAdmin;
	return true;
};

/**
 * @param {{ isAdmin?: boolean; status?: unknown } | null | undefined} user
 * @param {{ httpSubmitEnabled: boolean; draftAssignAdminOnly: boolean }} config
 */
export const canFinalizeDrafts = (user, config) => canSeeDraftsTab(user, config);
