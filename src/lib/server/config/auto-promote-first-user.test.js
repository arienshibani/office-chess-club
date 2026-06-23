import { beforeEach, describe, expect, it } from 'vitest';
import { isAutoPromoteFirstUserEnabled } from '$lib/server/config/auto-promote-first-user.js';
import { resetTestEnv, setTestEnv } from '../../../../tests/setup.js';

describe('isAutoPromoteFirstUserEnabled', () => {
	beforeEach(() => {
		resetTestEnv();
	});

	it('parses common truthy values', () => {
		for (const value of ['true', '1', 'yes', 'TRUE']) {
			setTestEnv('AUTO_PROMOTE_FIRST_USER', value);
			expect(isAutoPromoteFirstUserEnabled()).toBe(true);
		}
	});

	it('is disabled for other values', () => {
		setTestEnv('AUTO_PROMOTE_FIRST_USER', 'false');
		expect(isAutoPromoteFirstUserEnabled()).toBe(false);
	});
});
