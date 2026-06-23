/** @typedef {'light' | 'dark'} Theme */

export const DEFAULT_THEME = /** @type {Theme} */ ('dark');
export const THEME_STORAGE_KEY = 'occ-theme';

/** @param {unknown} raw @returns {Theme} */
export const normalizeTheme = (raw) => (raw === 'light' ? 'light' : 'dark');

/** @param {Theme} theme */
export const applyTheme = (theme) => {
	if (typeof document === 'undefined') return;
	const normalized = normalizeTheme(theme);
	document.documentElement.dataset.theme = normalized;
	try {
		localStorage.setItem(THEME_STORAGE_KEY, normalized);
	} catch {
		// ignore storage failures
	}
};
