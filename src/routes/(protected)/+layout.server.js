import { redirect } from '@sveltejs/kit';
import { isPublicBrowsePath, isPublicViewEnabled } from '$lib/server/config/public-view-config.js';
import { getConfig } from '$lib/server/db.js';
import { canSubmitMatches } from '$lib/server/players/player-status.js';

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ locals, url, depends }) {
	depends('app:session');
	depends('app:config');

	const cfgCol = await getConfig();
	const config = await cfgCol.findOne(/** @type {any} */ ({ _id: 'global_settings' }));
	const publicViewEnabled = isPublicViewEnabled(config);
	const clubNameRaw = typeof config?.clubName === 'string' ? config.clubName.trim() : '';

	if (!locals.user) {
		const canBrowse = publicViewEnabled && isPublicBrowsePath(url.pathname);
		if (!canBrowse) {
			redirect(302, `/login?next=${encodeURIComponent(url.pathname)}`);
		}
	}

	return {
		user: locals.user ?? null,
		canSubmit: locals.user ? canSubmitMatches(locals.user) : false,
		clubName: clubNameRaw || 'Office',
		publicViewEnabled,
	};
}
