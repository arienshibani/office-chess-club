<script>
	import { page } from '$app/stores';
	import {
		History,
		Home,
		LogIn,
		LogOut,
		Menu,
		PlusCircle,
		Shield,
		X
	} from '@lucide/svelte';
	import ClubMark from '$lib/components/common/ClubMark.svelte';
	import PlayerAvatar from '$lib/components/player/PlayerAvatar.svelte';
	import ThemeToggle from '$lib/components/theme/ThemeToggle.svelte';

	const { data, children } = $props();
	const user = $derived(data.user);
	const canSubmit = $derived(data.canSubmit);
	let menuOpen = $state(false);

	const closeMenu = () => {
		menuOpen = false;
	};

	$effect(() => {
		$page.url.pathname;
		menuOpen = false;
	});
</script>

<nav class:open={menuOpen}>
	<div class="nav-inner">
		<a href="/" class="brand" onclick={closeMenu}>
			<ClubMark size={18} strokeWidth={2.25} />
			<span class="brand-text">{data.clubName}</span>
		</a>

		<div class="nav-panel">
			<div class="nav-links">
				<a href="/" class="nav-link with-icon" class:active={$page.url.pathname === '/'} onclick={closeMenu}>
					<Home size={16} aria-hidden="true" />
					Home
				</a>
				<a
					href="/matches"
					class="nav-link with-icon"
					class:active={$page.url.pathname.startsWith('/matches')}
					onclick={closeMenu}
				>
					<History size={16} aria-hidden="true" />
					Match History
				</a>
				<a
					href="/submit"
					class="nav-link with-icon"
					class:active={$page.url.pathname === '/submit'}
					class:restricted={user && !canSubmit}
					onclick={closeMenu}
				>
					<PlusCircle size={16} aria-hidden="true" />
					Submit Result
				</a>
				{#if user}
					{#if user.isAdmin}
					<a
						href="/admin"
						class="nav-link with-icon"
						class:active={$page.url.pathname.startsWith('/admin')}
						onclick={closeMenu}
					>
						<Shield size={16} aria-hidden="true" />
						Admin
					</a>
					{/if}
				{/if}
			</div>
			<div class="user-area">
				{#if user}
					<a
						href="/players/{user._id}"
						class="nav-link with-icon"
						class:active={$page.url.pathname === `/players/${user._id}`}
						onclick={closeMenu}
					>
						<PlayerAvatar icon={user.icon} avatarUrl={user.avatarUrl} size={16} alt="" />
						<span class="nav-link-label">{user.name}</span>
					</a>
					<a href="/logout" class="logout-btn with-icon" data-sveltekit-reload onclick={closeMenu}>
						<LogOut size={15} aria-hidden="true" />
						Sign out
					</a>
				{:else}
					<a href="/login" class="login-btn with-icon" onclick={closeMenu}>
						<LogIn size={15} aria-hidden="true" />
						Sign in
					</a>
				{/if}
			</div>
		</div>

		<div class="nav-trailing">
			<ThemeToggle theme={user?.theme ?? 'dark'} />
			<button
				type="button"
				class="menu-toggle"
				aria-label={menuOpen ? 'Close menu' : 'Open menu'}
				aria-expanded={menuOpen}
				onclick={() => (menuOpen = !menuOpen)}
			>
				{#if menuOpen}
					<X size={20} aria-hidden="true" />
				{:else}
					<Menu size={20} aria-hidden="true" />
				{/if}
			</button>
		</div>
	</div>
</nav>

<main>
	{@render children()}
</main>

<style>
	nav {
		position: sticky;
		top: 0;
		z-index: 100;
		background: var(--color-nav-bg);
		border-bottom: 1px solid var(--color-border);
	}

	.nav-inner {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		padding: 0 1.5rem;
		min-height: 56px;
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-weight: 700;
		font-size: 0.9rem;
		text-decoration: none;
		color: var(--color-nav-text);
		min-width: 0;
		flex-shrink: 0;
	}

	.brand-text {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.nav-trailing {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-left: auto;
		flex-shrink: 0;
	}

	.menu-toggle {
		display: none;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		padding: 0;
		border: 1px solid var(--color-border-nav);
		border-radius: 8px;
		background: transparent;
		cursor: pointer;
		flex-shrink: 0;
		color: var(--color-nav-text);
	}

	.menu-toggle:hover {
		border-color: var(--color-text-dim);
	}

	.nav-panel {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		flex: 1;
		min-width: 0;
	}

	.nav-links {
		display: flex;
		gap: 1rem;
		flex: 1;
	}

	.nav-links a,
	.user-area .nav-link {
		text-decoration: none;
		color: var(--color-nav-text);
		font-size: 0.9rem;
		padding: 4px 0;
		border-bottom: 2px solid transparent;
		transition: color 0.15s, border-color 0.15s;
		white-space: nowrap;
	}

	.nav-links a.with-icon,
	.user-area .nav-link.with-icon {
		padding: 4px 2px;
	}

	.nav-links a:hover,
	.nav-links a.active,
	.user-area .nav-link:hover,
	.user-area .nav-link.active {
		color: var(--color-nav-text);
		border-color: var(--color-nav-text);
	}

	.nav-link-label {
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 140px;
	}

	.nav-links a.restricted {
		opacity: 0.55;
	}

	.user-area {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-left: auto;
		flex-shrink: 0;
	}

	.logout-btn {
		font-size: 0.8rem;
		color: var(--color-nav-text);
		text-decoration: none;
		padding: 6px 10px;
		border: 1px solid var(--color-border-nav);
		border-radius: 6px;
		transition: border-color 0.15s, color 0.15s;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.logout-btn:hover {
		color: var(--color-nav-text);
		border-color: var(--color-text-dim);
	}

	.login-btn {
		font-size: 0.8rem;
		color: var(--color-nav-text);
		text-decoration: none;
		padding: 6px 10px;
		border: 1px solid var(--color-border-nav);
		border-radius: 6px;
		transition: border-color 0.15s, color 0.15s;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.login-btn:hover {
		color: var(--color-nav-text);
		border-color: var(--color-text-dim);
	}

	main {
		padding: 2rem 1.5rem;
		max-width: 1100px;
		margin: 0 auto;
		width: 100%;
	}

	@media (max-width: 768px) {
		.nav-inner {
			flex-wrap: wrap;
			gap: 0;
			padding: 0 1rem;
		}

		.nav-trailing {
			gap: 0.35rem;
		}

		.menu-toggle {
			display: flex;
		}

		.nav-panel {
			display: none;
			flex-direction: column;
			align-items: stretch;
			gap: 0;
			flex: 1 1 100%;
			padding: 0 0 1rem;
			border-top: 1px solid var(--color-border);
		}

		nav.open .nav-panel {
			display: flex;
		}

		.nav-links {
			flex-direction: column;
			gap: 0;
			padding: 0.5rem 0;
		}

		.nav-links a,
		.user-area .nav-link {
			padding: 12px 4px;
			border-bottom: none;
			border-left: 3px solid transparent;
		}

		.nav-links a.active,
		.user-area .nav-link.active {
			border-left-color: var(--color-nav-text);
		}

		.user-area {
			margin-left: 0;
			padding-top: 0.75rem;
			border-top: 1px solid var(--color-border);
			flex-wrap: wrap;
		}

		.nav-link-label {
			max-width: none;
		}

		main {
			padding: 1.25rem 1rem;
		}
	}

	@media (max-width: 400px) {
		.brand-text {
			font-size: 0.92rem;
		}
	}
</style>
