<script>
	import { browser } from '$app/environment';
	import { applyTheme, DEFAULT_THEME, normalizeTheme, THEME_STORAGE_KEY } from '$lib/theme.js';

	/** @type {{ theme?: string | null }} */
	let { theme = null } = $props();

	$effect(() => {
		if (!browser) return;
		if (theme) {
			applyTheme(normalizeTheme(theme));
			return;
		}

		try {
			const stored = localStorage.getItem(THEME_STORAGE_KEY);
			applyTheme(stored ? normalizeTheme(stored) : DEFAULT_THEME);
		} catch {
			applyTheme(DEFAULT_THEME);
		}
	});
</script>
