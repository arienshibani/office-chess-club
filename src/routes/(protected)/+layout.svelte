<script>
	import { page } from '$app/stores';

	let { data, children } = $props();
	let user = $derived(data.user);
</script>

<svelte:head>
	<meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

<nav>
	<a href="/" class="brand">♟ Chess Club</a>
	<div class="nav-links">
		<a href="/" class:active={$page.url.pathname === '/'}>Leaderboard</a>
		{#if user?.isAdmin}
			<a href="/admin" class:active={$page.url.pathname.startsWith('/admin')}>Admin</a>
		{/if}
	</div>
	<div class="user-area">
		{#if user?.avatarUrl}
			<a href="/players/{user._id}">
				<img src={user.avatarUrl} alt={user.name} class="avatar" />
			</a>
		{/if}
		<span class="name">{user?.name}</span>
		<a href="/logout" class="logout-btn" data-sveltekit-reload>Sign out</a>
	</div>
</nav>

<main>
	{@render children()}
</main>

<style>
	:global(*, *::before, *::after) { box-sizing: border-box; }
	:global(body) {
		margin: 0;
		font-family: system-ui, -apple-system, sans-serif;
		background: #0f0f0f;
		color: #f0f0f0;
		min-height: 100vh;
	}
	:global(a) { color: inherit; }

	nav {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		padding: 0 1.5rem;
		height: 56px;
		background: #141414;
		border-bottom: 1px solid #222;
		position: sticky;
		top: 0;
		z-index: 100;
	}
	.brand {
		font-weight: 700;
		font-size: 1.1rem;
		text-decoration: none;
		color: #f0f0f0;
		white-space: nowrap;
	}
	.nav-links {
		display: flex;
		gap: 1rem;
		flex: 1;
	}
	.nav-links a {
		text-decoration: none;
		color: #888;
		font-size: 0.9rem;
		padding: 4px 0;
		border-bottom: 2px solid transparent;
		transition: color 0.15s, border-color 0.15s;
	}
	.nav-links a:hover, .nav-links a.active {
		color: #f0f0f0;
		border-color: #f0f0f0;
	}
	.user-area {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		margin-left: auto;
	}
	.avatar {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		display: block;
	}
	.name { font-size: 0.85rem; color: #aaa; }
	.logout-btn {
		font-size: 0.8rem;
		color: #666;
		text-decoration: none;
		padding: 4px 8px;
		border: 1px solid #333;
		border-radius: 4px;
		transition: border-color 0.15s, color 0.15s;
	}
	.logout-btn:hover { color: #f0f0f0; border-color: #555; }
	main { padding: 2rem 1.5rem; max-width: 1100px; margin: 0 auto; }
</style>
