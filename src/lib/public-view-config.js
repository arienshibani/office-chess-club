/** @param {import('mongodb').Document | null | undefined} config */
export const isPublicViewEnabled = (config) => config?.publicViewEnabled !== false;

/** @param {string} pathname */
export const isPublicBrowsePath = (pathname) => {
	if (pathname === '/') return true;
	if (pathname === '/matches' || pathname.startsWith('/matches/')) return true;
	if (pathname.startsWith('/players/')) return true;
	return false;
};
