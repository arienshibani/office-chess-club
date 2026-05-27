<script>
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { normalizePlayerIcon } from '$lib/player-icon.js';

	let { value = $bindable(''), name = '' } = $props();

	let open = $state(false);
	let ready = $state(false);
	/** @type {HTMLDivElement | null} */
	let wrapperEl = $state(null);
	/** @type {HTMLElement | null} */
	let pickerEl = $state(null);

	onMount(async () => {
		await import('emoji-picker-element');
		ready = true;
	});

	/** @param {Event} event */
	const selectEmoji = (event) => {
		const detail = /** @type {CustomEvent<{ unicode: string }>} */ (event).detail;
		value = normalizePlayerIcon(detail.unicode);
		open = false;
	};

	const toggle = () => {
		open = !open;
	};

	const clear = () => {
		value = '';
		open = false;
	};

	$effect(() => {
		if (!browser || !open) return;
		/** @param {MouseEvent} e */
		const onDocClick = (e) => {
			if (wrapperEl && !wrapperEl.contains(/** @type {Node} */ (e.target))) {
				open = false;
			}
		};
		document.addEventListener('click', onDocClick);
		return () => document.removeEventListener('click', onDocClick);
	});

	$effect(() => {
		const el = pickerEl;
		if (!el) return;
		el.addEventListener('emoji-click', selectEmoji);
		return () => el.removeEventListener('emoji-click', selectEmoji);
	});
</script>

<div class="emoji-picker" bind:this={wrapperEl}>
	<div class="trigger-row">
		<button
			type="button"
			class="trigger"
			onclick={toggle}
			aria-expanded={open}
			aria-haspopup="dialog"
		>
			<span class="emoji-display" aria-hidden="true">{value || '♟'}</span>
			<span class="hint">{value ? 'Change icon' : 'Pick an icon'}</span>
		</button>
		{#if value}
			<button type="button" class="clear" onclick={clear} aria-label="Clear icon">×</button>
		{/if}
	</div>
	{#if open}
		<div class="popover" role="dialog" aria-label="Emoji picker">
			{#if ready}
				<emoji-picker bind:this={pickerEl}></emoji-picker>
			{:else}
				<p class="loading">Loading picker…</p>
			{/if}
		</div>
	{/if}
	{#if name}
		<input type="hidden" {name} {value} />
	{/if}
</div>

<style>
	.emoji-picker {
		position: relative;
	}

	.trigger-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.trigger {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		background: var(--color-input-bg);
		border: 1px solid var(--color-border-strong);
		border-radius: 6px;
		color: var(--color-text);
		padding: 6px 10px;
		font-size: 0.9rem;
		font-family: inherit;
		cursor: pointer;
	}

	.trigger:hover,
	.trigger:focus-visible {
		border-color: var(--color-border-focus);
		outline: none;
	}

	.emoji-display {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		font-size: 1.35rem;
		line-height: 1;
		background: var(--color-surface-raised);
		border-radius: 6px;
	}

	.hint {
		color: var(--color-text-subtle);
		font-size: 0.82rem;
	}

	.clear {
		background: none;
		border: 1px solid var(--color-border-strong);
		border-radius: 6px;
		color: var(--color-text-subtle);
		width: 2rem;
		height: 2rem;
		font-size: 1.1rem;
		line-height: 1;
		cursor: pointer;
		padding: 0;
	}

	.clear:hover {
		color: var(--color-text);
		border-color: var(--color-border-focus);
	}

	.popover {
		position: absolute;
		top: calc(100% + 6px);
		left: 0;
		z-index: 50;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
	}

	.loading {
		margin: 0;
		padding: 1rem 1.25rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border-strong);
		color: var(--color-text-subtle);
		font-size: 0.82rem;
	}

	.popover :global(emoji-picker) {
		--num-columns: 8;
		--emoji-size: 1.375rem;
		--background: var(--color-surface);
		--border-color: var(--color-border-strong);
		--button-active-background: var(--color-border-nav);
		--button-hover-background: var(--color-border);
		--category-font-color: var(--color-text-subtle);
		--input-border-color: var(--color-border-strong);
		--input-font-color: var(--color-text);
		--input-placeholder-color: var(--color-text-faint);
		--outline-color: var(--color-text-dim);
		--indicator-color: var(--color-accent-gold);
	}
</style>
