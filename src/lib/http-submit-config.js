import { randomBytes } from 'node:crypto';
import { getConfig } from '$lib/db.js';

/** @returns {string} */
export const generateHttpSubmitApiKey = () => randomBytes(32).toString('base64url');

/** @returns {Promise<{ enabled: boolean, apiKey: string }>} */
export const getHttpSubmitConfig = async () => {
	const cfgCol = await getConfig();
	const config = await cfgCol.findOne(/** @type {any} */ ({ _id: 'global_settings' }));

	return {
		enabled: config?.httpSubmitEnabled === true,
		apiKey: typeof config?.httpSubmitApiKey === 'string' ? config.httpSubmitApiKey.trim() : '',
	};
};
