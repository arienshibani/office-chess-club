import { normalizeTheme } from '$lib/theme.js';

/** @type {import('./$types').LayoutServerLoad} */
export function load({ locals, depends }) {
	depends('app:session');

	return {
		theme: locals.user?.theme ? normalizeTheme(locals.user.theme) : null
	};
};
