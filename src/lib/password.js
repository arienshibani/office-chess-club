import { randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

/** @param {string} password */
export const hashPassword = async (password) => {
	const salt = randomBytes(16);
	const hash = /** @type {Buffer} */ (await scryptAsync(password, salt, 64));
	return `${salt.toString('hex')}:${hash.toString('hex')}`;
};

/** @param {string} password @param {string} stored */
export const verifyPassword = async (password, stored) => {
	const [saltHex, hashHex] = stored.split(':');
	if (!saltHex || !hashHex) return false;
	const salt = Buffer.from(saltHex, 'hex');
	const expected = Buffer.from(hashHex, 'hex');
	const hash = /** @type {Buffer} */ (await scryptAsync(password, salt, 64));
	if (hash.length !== expected.length) return false;
	return timingSafeEqual(hash, expected);
};

/** @param {string} raw */
export const normalizeUsername = (raw) => raw.trim().toLowerCase();
