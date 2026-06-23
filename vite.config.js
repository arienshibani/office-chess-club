import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

const dockerDev = process.env.DOCKER_DEV === 'true';

export default defineConfig({
	plugins: [sveltekit()],
	server: dockerDev
		? {
				host: true,
				watch: {
					usePolling: true,
					interval: 300,
				},
				// Browser runs on the host; HMR must use localhost, not the container IP.
				hmr: {
					host: 'localhost',
					clientPort: 5173,
				},
			}
		: undefined,
	ssr: {
		// @lucide/svelte icon modules re-export .svelte files; bundle them for SSR.
		noExternal: ['@lucide/svelte'],
	},
});
