import { redirect } from '@sveltejs/kit';
import { getConfig } from '$lib/db.js';
import { canSubmitMatches } from '$lib/player-status.js';

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ locals, url, depends }) {
	depends('app:session');
	depends('app:config');

	if (!locals.user) {
		redirect(302, `/login?next=${encodeURIComponent(url.pathname)}`);
	}

	const cfgCol = await getConfig();
	const config = await cfgCol.findOne(/** @type {any} */ ({ _id: 'global_settings' }));
	const clubNameRaw = typeof config?.clubName === 'string' ? config.clubName.trim() : '';

	return {
		user: locals.user,
		canSubmit: canSubmitMatches(locals.user),
		clubName: clubNameRaw || 'Office'
	};
}
