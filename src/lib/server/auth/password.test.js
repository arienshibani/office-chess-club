import { describe, expect, it } from 'vitest';
import { hashPassword, normalizeUsername, verifyPassword } from '$lib/server/auth/password.js';

describe('password', () => {
	it('normalizes usernames to lowercase trimmed values', () => {
		expect(normalizeUsername('  Alice  ')).toBe('alice');
	});

	it('hashes and verifies a password', async () => {
		const stored = await hashPassword('secret-pass');
		expect(await verifyPassword('secret-pass', stored)).toBe(true);
		expect(await verifyPassword('wrong-pass', stored)).toBe(false);
	});

	it('rejects malformed stored hashes', async () => {
		expect(await verifyPassword('secret-pass', 'not-a-hash')).toBe(false);
	});
});
