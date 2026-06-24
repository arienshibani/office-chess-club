import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.test.js', 'tests/**/*.test.js'],
		environment: 'node',
		setupFiles: ['tests/setup.js'],
		pool: 'forks',
		fileParallelism: false,
	},
});
