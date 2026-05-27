<script>
import { page } from "$app/stores";
import PlayerAvatar from "$lib/PlayerAvatar.svelte";

const { data, children } = $props();
const user = $derived(data.user);
</script>

<svelte:head>
	<meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

<nav class="">
	<a href="/" class="brand">{data.clubName} Chess Club ♟️</a>
	<div class="nav-links">
		<a href="/" class:active={$page.url.pathname === '/'}>Home</a>
		<a href="/matches" class:active={$page.url.pathname.startsWith('/matches')}>Match History</a>
		<a href="/submit" class:active={$page.url.pathname === '/submit'}>Submit Result</a>
		{#if user?.isAdmin}
			<a href="/admin" class:active={$page.url.pathname.startsWith('/admin')}>Admin</a>
		{/if}
	</div>
	<div class="user-area">
		{#if user}
			<a href="/players/{user._id}" class="user-profile-link">
				<PlayerAvatar icon={user.icon} avatarUrl={user.avatarUrl} size={28} alt={user.name} />
				<span class="name">{user.name}</span>
			</a>
		{/if}
		<a href="/logout" class="logout-btn" data-sveltekit-reload>Sign out</a>
	</div>
</nav>

<main>
	{@render children()}
</main>

<style>
	nav {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		padding: 0 1.5rem;
		height: 56px;
		background: var(--color-nav-bg);
		border-bottom: 1px solid var(--color-border);
		position: sticky;
		top: 0;
		z-index: 100;
	}
	.brand {
		font-weight: 700;
		font-size: 1.1rem;
		text-decoration: none;
		color: var(--color-nav-text);
		white-space: nowrap;
	}
	.nav-links {
		display: flex;
		gap: 1rem;
		flex: 1;
	}
	.nav-links a {
		text-decoration: none;
		color: var(--color-nav-text);
		font-size: 0.9rem;
		padding: 4px 0;
		border-bottom: 2px solid transparent;
		transition: color 0.15s, border-color 0.15s;
	}
	.nav-links a:hover, .nav-links a.active {
		color: var(--color-nav-text);
		border-color: var(--color-nav-text);
	}
	.user-area {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		margin-left: auto;
	}
	.user-profile-link {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		text-decoration: none;
		color: inherit;
	}
	.user-profile-link:hover .name { color: var(--color-nav-text); }
	.name { font-size: 0.85rem; color: var(--color-nav-text-muted); transition: color 0.15s; }
	.logout-btn {
		font-size: 0.8rem;
		color: var(--color-nav-text);
		text-decoration: none;
		padding: 4px 8px;
		border: 1px solid var(--color-border-nav);
		border-radius: 4px;
		transition: border-color 0.15s, color 0.15s;
	}
	.logout-btn:hover { color: var(--color-nav-text); border-color: var(--color-text-dim); }
	main { padding: 2rem 1.5rem; max-width: 1100px; margin: 0 auto; }
</style>
