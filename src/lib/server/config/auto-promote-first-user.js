import { env } from '$env/dynamic/private';

/** @returns {boolean} */
export const isAutoPromoteFirstUserEnabled = () => {
	const raw = env.AUTO_PROMOTE_FIRST_USER?.trim().toLowerCase();
	return raw === 'true' || raw === '1' || raw === 'yes';
};
