<script>
	let {
		icon = '',
		avatarUrl = '',
		size = 24,
		placeholder = '',
		alt = '',
		class: className = ''
	} = $props();

	let px = $derived(typeof size === 'number' ? `${size}px` : size);
</script>

{#if icon}
	<span
		class="player-emoji {className}"
		style="width: {px}; height: {px}; font-size: calc({px} * 0.85);"
		aria-hidden={alt ? undefined : 'true'}
	>{icon}</span>
{:else if avatarUrl}
	<img src={avatarUrl} {alt} class="player-img {className}" style="width: {px}; height: {px};" />
{:else if placeholder}
	<span
		class="player-placeholder {className}"
		style="width: {px}; height: {px}; font-size: calc({px} * 0.55);"
		aria-hidden={alt ? undefined : 'true'}
	>{placeholder}</span>
{/if}

<style>
	.player-emoji,
	.player-placeholder {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		line-height: 1;
	}
	.player-img {
		border-radius: 50%;
		object-fit: cover;
		flex-shrink: 0;
		display: block;
	}
	.player-placeholder {
		background: var(--color-placeholder-bg);
		border-radius: 50%;
	}
</style>
