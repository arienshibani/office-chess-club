<script>
	import { page } from '$app/stores';

	const errorMessages = {
		state_mismatch: 'Invalid or expired sign-in state. Try again from /login (avoid back button).',
		oauth_failed: 'Slack rejected the token exchange.',
		identity_failed: 'Could not read your Slack profile.',
		upsert_failed: 'Could not save your player record.',
		db_error: 'Signed in with Slack but MongoDB failed. Check MONGODB_URI and Atlas network access.',
		no_token: 'Slack did not return an access token.',
		internal_error: 'Slack returned an internal error during token exchange. Try again in a minute.',
		oauth_authorization_url_mismatch:
			'OAuth started on the wrong Slack URL. Redeploy and sign in again from /login.',
		invalid_grant: 'PKCE or authorization code mismatch — sign in again from /login.',
		config_error: 'Server misconfiguration — missing Slack or ORIGIN env vars on Vercel.',
		bad_redirect_uri:
			'Redirect URI mismatch. In Slack and Vercel, use the same URL (e.g. https://your-app.vercel.app/auth/callback/slack).',
		invalid_code: 'Authorization code expired. Sign in again from /login.',
		invalid_client: 'Wrong SLACK_CLIENT_ID or SLACK_CLIENT_SECRET in Vercel env vars.'
	};

</script>

<svelte:head>
	<title>Sign In — Office Chess Club</title>
</svelte:head>

<div class="login-wrap">
	<div class="login-card">
		<div class="logo">♟</div>
		<h1>Office Chess Club</h1>
		<p>Track your Elo, review games, and dominate the leaderboard.</p>
		{#if $page.url.searchParams.get('error')}
			{@const code = $page.url.searchParams.get('error')}
			{@const desc = $page.url.searchParams.get('desc')}
			{@const redirectUri = $page.url.searchParams.get('redirect_uri')}
			<div class="error-box">
				<p class="error">{errorMessages[code ?? ''] ?? `Sign-in failed (${code}).`}</p>
				{#if desc}
					<p class="error-detail">Slack: {desc}</p>
				{/if}
				{#if redirectUri}
					<p class="error-detail">Callback used: <code>{redirectUri}</code></p>
				{/if}
				<p class="error-detail">Vercel → Logs → filter <code>[slack-oauth]</code></p>
			</div>
		{/if}
		{#if import.meta.env.DEV}
			<p class="hint">
				Callback: <code>http://localhost:5173/auth/callback/slack</code><br />
				PKCE is on for this Slack app (cannot be disabled). Use a full page reload from <code>/login</code> if sign-in fails.
			</p>
		{/if}
		<form action="/auth/slack" method="get">
			<button type="submit" class="slack-btn">
			<svg width="20" height="20" viewBox="0 0 122.8 122.8" xmlns="http://www.w3.org/2000/svg">
				<path d="M25.8 77.6c0 7.1-5.8 12.9-12.9 12.9S0 84.7 0 77.6s5.8-12.9 12.9-12.9h12.9v12.9z" fill="#e01e5a"/>
				<path d="M32.3 77.6c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9v32.3c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V77.6z" fill="#e01e5a"/>
				<path d="M45.2 25.8c-7.1 0-12.9-5.8-12.9-12.9S38.1 0 45.2 0s12.9 5.8 12.9 12.9v12.9H45.2z" fill="#36c5f0"/>
				<path d="M45.2 32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H12.9C5.8 58.1 0 52.3 0 45.2s5.8-12.9 12.9-12.9h32.3z" fill="#36c5f0"/>
				<path d="M97 45.2c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9-5.8 12.9-12.9 12.9H97V45.2z" fill="#2eb67d"/>
				<path d="M90.5 45.2c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V12.9C64.7 5.8 70.5 0 77.6 0s12.9 5.8 12.9 12.9v32.3z" fill="#2eb67d"/>
				<path d="M77.6 97c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9-12.9-5.8-12.9-12.9V97h12.9z" fill="#ecb22e"/>
				<path d="M77.6 90.5c-7.1 0-12.9-5.8-12.9-12.9s5.8-12.9 12.9-12.9h32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H77.6z" fill="#ecb22e"/>
			</svg>
			Sign in with Slack
			</button>
		</form>
	</div>
</div>

<style>
	:global(body) { margin: 0; font-family: system-ui, sans-serif; background: #0f0f0f; color: #f0f0f0; }
	.login-wrap {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.login-card {
		background: #1a1a1a;
		border: 1px solid #2a2a2a;
		border-radius: 16px;
		padding: 3rem 2.5rem;
		text-align: center;
		max-width: 380px;
		width: 100%;
	}
	.logo { font-size: 4rem; margin-bottom: 0.5rem; }
	h1 { margin: 0 0 0.5rem; font-size: 1.5rem; font-weight: 700; }
	p { color: #888; margin: 0 0 1rem; font-size: 0.95rem; }
	.error-box {
		text-align: left;
		background: #2a1515;
		border: 1px solid #4a2020;
		border-radius: 8px;
		padding: 1rem;
		margin: 0 0 1rem;
		max-width: 100%;
	}
	.error { color: #f87171; font-size: 0.9rem; margin: 0 0 0.5rem; }
	.error-detail { color: #aaa; font-size: 0.8rem; margin: 0.35rem 0; }
	.error-detail code { color: #ccc; font-size: 0.85em; word-break: break-all; }
	.hint { font-size: 0.8rem; color: #666; margin: 0 0 1.5rem; }
	.hint code { color: #aaa; font-size: 0.85em; }
	form { margin: 0; }
	.slack-btn {
		display: inline-flex;
		border: none;
		cursor: pointer;
		font-family: inherit;
		align-items: center;
		gap: 10px;
		background: #fff;
		color: #1d1c1d;
		text-decoration: none;
		padding: 12px 24px;
		border-radius: 8px;
		font-weight: 600;
		font-size: 0.95rem;
		transition: opacity 0.15s;
	}
	.slack-btn:hover { opacity: 0.88; }
</style>
