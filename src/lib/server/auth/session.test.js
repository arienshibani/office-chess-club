import { describe, expect, it } from 'vitest';
import { createSessionToken, verifySessionToken } from '$lib/server/auth/session.js';

describe('session', () => {
	it('creates a token that resolves to the original user id', () => {
		const token = createSessionToken('user-123');
		expect(verifySessionToken(token)).toBe('user-123');
	});

	it('rejects tampered tokens', () => {
		const token = createSessionToken('user-123');
		const decoded = Buffer.from(token, 'base64url').toString('utf8');
		const tampered = Buffer.from(`${decoded}x`, 'utf8').toString('base64url');

		expect(verifySessionToken(tampered)).toBeNull();
		expect(verifySessionToken('not-valid')).toBeNull();
	});
});
