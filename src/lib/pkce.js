import { createHash, randomBytes } from 'crypto';

/** @returns {{ codeVerifier: string, codeChallenge: string }} */
export const createPkcePair = () => {
	const codeVerifier = randomBytes(32).toString('base64url');
	const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');
	return { codeVerifier, codeChallenge };
};
