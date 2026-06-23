import { loadEnv } from 'vite';
import { vi } from 'vitest';

const env = loadEnv('test', process.cwd(), '');

for (const [key, value] of Object.entries(env)) {
	process.env[key] ??= value;
}

vi.mock('$env/dynamic/private', () => ({
	get env() {
		return process.env;
	},
}));

vi.mock('$lib/server/integrations/slack.js', () => ({
	notifyMatchApproved: vi.fn(async () => {}),
	notifyPendingMatch: vi.fn(async () => {}),
}));

/** @param {string} key @param {string | undefined} value */
export const setTestEnv = (key, value) => {
	if (value === undefined) {
		delete process.env[key];
		return;
	}
	process.env[key] = value;
};

export const resetTestEnv = () => {
	for (const key of Object.keys(process.env)) {
		if (!(key in env)) {
			delete process.env[key];
		}
	}
	for (const [key, value] of Object.entries(env)) {
		process.env[key] = value;
	}
};
