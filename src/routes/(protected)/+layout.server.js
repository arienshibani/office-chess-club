import { redirect } from '@sveltejs/kit';
import { getConfig } from '$lib/db.js';
import { canSubmitMatches } from '$lib/player-status.js';
import { isPublicBrowsePath, isPublicViewEnabled } from '$lib/public-view-config.js';

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
