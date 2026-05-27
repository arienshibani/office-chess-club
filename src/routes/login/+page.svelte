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
	:global(body) {
		margin: 0;
		font-family: system-ui, sans-serif;
		background: #0f0f0f;
		color: #f0f0f0;
	}
	.login-wrap {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
	}
	.login-card {
		background: #1a1a1a;
		border: 1px solid #2a2a2a;
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
		color: #888;
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
		color: #666;
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
		color: #aaa;
	}
	input {
		padding: 10px 12px;
		border-radius: 8px;
		border: 1px solid #333;
		background: #111;
		color: #f0f0f0;
		font-size: 0.95rem;
	}
	input:focus {
		outline: none;
		border-color: #555;
	}
	button {
		margin-top: 0.25rem;
		padding: 12px;
		border: none;
		border-radius: 8px;
		background: #fff;
		color: #1d1c1d;
		font-weight: 600;
		cursor: pointer;
	}
	button.secondary {
		background: #2a2a2a;
		color: #f0f0f0;
		border: 1px solid #444;
	}
	button:hover {
		opacity: 0.9;
	}
	.error {
		background: #2a1515;
		border: 1px solid #4a2020;
		border-radius: 8px;
		padding: 0.75rem 1rem;
		color: #f87171;
		font-size: 0.9rem;
		margin: 0 0 1rem;
	}
</style>
