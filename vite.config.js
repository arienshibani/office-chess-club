import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	ssr: {
		// @lucide/svelte icon modules re-export .svelte files; bundle them for SSR.
		noExternal: ['@lucide/svelte']
	}
});
