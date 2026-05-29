<script>
	import { invalidateAll } from '$app/navigation';
	import { Moon, Sun } from '@lucide/svelte';
	import { applyTheme, normalizeTheme } from '$lib/theme.js';

	/** @type {{ theme?: 'light' | 'dark' | string, class?: string }} */
	let { theme = 'dark', class: className = '' } = $props();

	let current = $state(normalizeTheme(theme));
	let saving = $state(false);

	$effect(() => {
		if (!saving) current = normalizeTheme(theme);
	});

	const toggleTheme = async () => {
		if (saving) return;

		const next = current === 'dark' ? 'light' : 'dark';
		current = next;
		applyTheme(next);
		saving = true;

		try {
			const res = await fetch('/api/theme', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ theme: next })
			});

			if (!res.ok) throw new Error('Failed to save theme');

			await invalidateAll();
		} catch {
			const revert = next === 'dark' ? 'light' : 'dark';
			current = revert;
			applyTheme(revert);
		} finally {
			saving = false;
		}
	};
</script>

<button
	type="button"
	class="theme-toggle {className}"
	disabled={saving}
	onclick={toggleTheme}
	aria-label={current === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
	title={current === 'dark' ? 'Light mode' : 'Dark mode'}
>
	{#if current === 'dark'}
		<Sun size={18} aria-hidden="true" />
	{:else}
		<Moon size={18} aria-hidden="true" />
	{/if}
</button>

<style>
	.theme-toggle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		padding: 0;
		border: 1px solid var(--color-border-nav);
		border-radius: 8px;
		background: transparent;
		color: var(--color-nav-text);
		cursor: pointer;
		transition: border-color 0.15s, opacity 0.15s;
	}

	.theme-toggle:hover:not(:disabled) {
		border-color: var(--color-text-dim);
	}

	.theme-toggle:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
