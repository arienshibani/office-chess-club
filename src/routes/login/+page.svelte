<script>
	import { enhance } from '$app/forms';

	let { form } = $props();
</script>

<svelte:head>
	<title>Sign In — Office Chess Club</title>
</svelte:head>

<div class="login-wrap">
	<div class="login-card">
		<div class="logo">♟</div>
		<h1>Office Chess Club</h1>
		<p>Track your Elo, review games, and dominate the leaderboard.</p>

		{#if form?.error}
			<p class="error">{form.error}</p>
		{/if}

		<section>
			<h2>Sign in</h2>
			<form method="POST" action="?/login" use:enhance>
				<label>
					Username
					<input name="username" type="text" autocomplete="username" required />
				</label>
				<label>
					Password
					<input name="password" type="password" autocomplete="current-password" required />
				</label>
				<button type="submit">Sign in</button>
			</form>
		</section>

		<section>
			<h2>Create account</h2>
			<form method="POST" action="?/register" use:enhance>
				<label>
					Username
					<input name="username" type="text" autocomplete="username" required />
				</label>
				<label>
					Display name
					<input name="name" type="text" autocomplete="name" placeholder="Optional" />
				</label>
				<label>
					Password
					<input name="password" type="password" autocomplete="new-password" required />
				</label>
				<button type="submit" class="secondary">Create account</button>
			</form>
		</section>
	</div>
</div>

<style>
	.login-wrap {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
	}
	.login-card {
		background: var(--color-surface-raised);
		border: 1px solid var(--color-border-strong);
		border-radius: 16px;
		padding: 2.5rem 2rem;
		max-width: 400px;
		width: 100%;
	}
	.logo {
		font-size: 3rem;
		text-align: center;
		margin-bottom: 0.25rem;
	}
	h1 {
		margin: 0 0 0.5rem;
		font-size: 1.5rem;
		text-align: center;
	}
	.login-card > p {
		color: var(--color-text-subtle);
		font-size: 0.9rem;
		text-align: center;
		margin: 0 0 1.5rem;
	}
	section {
		margin-bottom: 1.75rem;
	}
	section:last-child {
		margin-bottom: 0;
	}
	h2 {
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-faint);
		margin: 0 0 0.75rem;
	}
	form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}
	input {
		padding: 10px 12px;
		border-radius: 8px;
		border: 1px solid var(--color-login-input-border);
		background: var(--color-login-input-bg);
		color: var(--color-text);
		font-size: 0.95rem;
	}
	input:focus {
		outline: none;
		border-color: var(--color-text-dim);
	}
	button {
		margin-top: 0.25rem;
		padding: 12px;
		border: none;
		border-radius: 8px;
		background: var(--color-btn-primary-bg);
		color: var(--color-btn-primary-text);
		font-weight: 600;
		cursor: pointer;
	}
	button.secondary {
		background: var(--color-btn-secondary-bg);
		color: var(--color-btn-secondary-text);
		border: 1px solid var(--color-border-focus);
	}
	button:hover {
		opacity: 0.9;
	}
	.error {
		background: var(--color-error-bg-soft);
		border: 1px solid var(--color-error-border-soft);
		border-radius: 8px;
		padding: 0.75rem 1rem;
		color: var(--color-error-soft);
		font-size: 0.9rem;
		margin: 0 0 1rem;
	}
</style>
