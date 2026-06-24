import { describe, expect, it } from 'vitest';
import { canSubmitMatches, normalizePlayerStatus } from '$lib/server/players/player-status.js';

describe('player-status', () => {
	it('treats missing status as member', () => {
		expect(normalizePlayerStatus(undefined)).toBe('member');
	});

	it('allows admins and members to submit matches', () => {
		expect(canSubmitMatches({ isAdmin: true, status: 'pending' })).toBe(true);
		expect(canSubmitMatches({ isAdmin: false, status: 'member' })).toBe(true);
	});

	it('blocks pending non-admin users', () => {
		expect(canSubmitMatches({ isAdmin: false, status: 'pending' })).toBe(false);
		expect(canSubmitMatches(null)).toBe(false);
	});
});
