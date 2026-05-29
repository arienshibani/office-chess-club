<script>
import { enhance } from "$app/forms";

let { data, form } = $props();

/** @type {'sign-in' | 'sign-up'} */
let mode = $state("sign-in");
/** @type {1 | 2} */
let stage = $state(1);

let username = $state("");
let name = $state("");
let password = $state("");
let submitting = $state(false);
let clientError = $state("");

$effect(() => {
	if (form?.action === "login") {
		mode = "sign-in";
		stage = 2;
	} else if (form?.action === "register") {
		mode = "sign-up";
		stage = 2;
	}
});

const resetStage = () => {
	stage = 1;
	password = "";
	clientError = "";
};

const switchMode = (/** @type {'sign-in' | 'sign-up'} */ next) => {
	mode = next;
	resetStage();
};

const continueSignIn = () => {
	clientError = "";
	if (!username.trim()) {
		clientError = "Enter your username.";
		return;
	}
	stage = 2;
};

const continueSignUp = () => {
	clientError = "";
	const value = username.trim();
	if (value.length < 2) {
		clientError = "Username must be at least 2 characters.";
		return;
	}
	stage = 2;
};

const heading = $derived(
	mode === "sign-in"
		? stage === 1
			? "Sign in to your account"
			: "Enter your password"
		: stage === 1
			? "Create your account"
			: "Finish setting up",
);

const subheading = $derived(
	mode === "sign-in"
		? stage === 1
			? "Welcome back. Enter your username to continue."
			: `Signing in as ${username}`
		: stage === 1
			? "Pick a username for logging in."
			: "Add a display name and password.",
);
</script>

<svelte:head>
	<title>{mode === 'sign-in' ? 'Sign in' : 'Create account'} — {data.clubName} Chess Club</title>
</svelte:head>

<div class="login-wrap">
	<div class="login-card">
		<div class="brand">
			<div class="logo">♟</div>
			<p class="brand-name">{data.clubName} Chess Club</p>
		</div>

		<div class="mode-tabs" role="tablist" aria-label="Authentication mode">
			<button
				type="button"
				role="tab"
				class:active={mode === 'sign-in'}
				aria-selected={mode === 'sign-in'}
				onclick={() => switchMode('sign-in')}
			>
				Sign in
			</button>
			<button
				type="button"
				role="tab"
				class:active={mode === 'sign-up'}
				aria-selected={mode === 'sign-up'}
				onclick={() => switchMode('sign-up')}
			>
				Create account
			</button>
		</div>

		<div class="panel">
			<h1>{heading}</h1>
			<p class="subtitle">{subheading}</p>

			{#if form?.error}
				<p class="error">{form.error}</p>
			{:else if clientError}
				<p class="error">{clientError}</p>
			{/if}

			{#if mode === 'sign-in'}
				{#if stage === 1}
					<form
						class="stage-form"
						onsubmit={(event) => {
							event.preventDefault();
							continueSignIn();
						}}
					>
						<label>
							<span class="label">Username</span>
							<input
								bind:value={username}
								type="text"
								autocomplete="username"
								placeholder="your.username"
								required
							/>
						</label>
						<button type="submit" class="primary">Continue</button>
					</form>
				{:else}
					<form
						method="POST"
						action="?/login"
						class="stage-form"
						use:enhance={() => {
							submitting = true;
							return async ({ update }) => {
								await update();
								submitting = false;
							};
						}}
					>
						<input type="hidden" name="username" value={username} />
						<label>
							<span class="label">Password</span>
							<input
								bind:value={password}
								name="password"
								type="password"
								autocomplete="current-password"
								placeholder="••••••••"
								required
							/>
						</label>
						<button type="submit" class="primary" disabled={submitting}>
							{submitting ? 'Signing in…' : 'Sign in'}
						</button>
						<button type="button" class="text-btn" onclick={resetStage}>← Use a different username</button>
					</form>
				{/if}
			{:else if stage === 1}
				<form
					class="stage-form"
					onsubmit={(event) => {
						event.preventDefault();
						continueSignUp();
					}}
				>
					<label>
						<span class="label">Username</span>
						<input
							bind:value={username}
							type="text"
							autocomplete="username"
							placeholder="your.username"
							required
						/>
					</label>
					<button type="submit" class="primary">Continue</button>
				</form>
			{:else}
				<form
					method="POST"
					action="?/register"
					class="stage-form"
					use:enhance={() => {
						submitting = true;
						return async ({ update }) => {
							await update();
							submitting = false;
						};
					}}
				>
					<input type="hidden" name="username" value={username} />
					<label>
						<span class="label">Display name</span>
						<input
							bind:value={name}
							name="name"
							type="text"
							autocomplete="name"
							placeholder={username}
						/>
						<span class="hint">Optional — defaults to your username.</span>
					</label>
					<label>
						<span class="label">Password</span>
						<input
							bind:value={password}
							name="password"
							type="password"
							autocomplete="new-password"
							placeholder="••••••••"
							required
						/>
						<span class="hint">At least 4 characters.</span>
					</label>
					<button type="submit" class="primary" disabled={submitting}>
						{submitting ? 'Creating account…' : 'Create account'}
					</button>
					<button type="button" class="text-btn" onclick={resetStage}>← Choose a different username</button>
				</form>
			{/if}
		</div>

		<p class="footer-switch">
			{#if mode === 'sign-in'}
				Don't have an account?
				<button type="button" class="link-btn" onclick={() => switchMode('sign-up')}>Sign up</button>
			{:else}
				Already have an account?
				<button type="button" class="link-btn" onclick={() => switchMode('sign-in')}>Sign in</button>
			{/if}
		</p>
	</div>
</div>

<style>
	.login-wrap {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		background:
			radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255, 255, 255, 0.06), transparent),
			var(--color-bg);
	}

	.login-card {
		background: var(--color-surface-raised);
		border: 1px solid var(--color-border-strong);
		border-radius: 14px;
		box-shadow: 0 24px 48px rgba(0, 0, 0, 0.35);
		padding: 1.75rem;
		max-width: 420px;
		width: 100%;
	}

	.brand {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.35rem;
		margin-bottom: 1.25rem;
	}

	.logo {
		font-size: 2rem;
		line-height: 1;
	}

	.brand-name {
		margin: 0;
		font-size: 0.82rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--color-text-faint);
	}

	.mode-tabs {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 4px;
		padding: 4px;
		border-radius: 10px;
		background: var(--color-surface-muted);
		border: 1px solid var(--color-border);
		margin-bottom: 1.25rem;
	}

	.mode-tabs button {
		border: none;
		border-radius: 7px;
		padding: 8px 10px;
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--color-tab-inactive);
		background: transparent;
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
	}

	.mode-tabs button.active {
		background: var(--color-surface-raised);
		color: var(--color-tab-active);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
	}

	.panel h1 {
		margin: 0 0 0.35rem;
		font-size: 1.35rem;
		font-weight: 600;
		color: var(--color-heading);
	}

	.subtitle {
		margin: 0 0 1.25rem;
		font-size: 0.88rem;
		line-height: 1.45;
		color: var(--color-text-subtle);
	}

	.stage-form {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.label {
		font-size: 0.78rem;
		font-weight: 500;
		color: var(--color-text-muted);
	}

	.hint {
		font-size: 0.74rem;
		color: var(--color-text-faint);
	}

	input {
		padding: 11px 12px;
		border-radius: 8px;
		border: 1px solid var(--color-login-input-border);
		background: var(--color-login-input-bg);
		color: var(--color-text);
		font-size: 0.92rem;
		transition: border-color 0.15s, box-shadow 0.15s;
	}

	input::placeholder {
		color: var(--color-text-extra-dim);
	}

	input:focus {
		outline: none;
		border-color: var(--color-border-focus);
		box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.06);
	}

	.primary {
		margin-top: 0.15rem;
		padding: 11px 12px;
		border: none;
		border-radius: 8px;
		background: var(--color-btn-primary-bg);
		color: var(--color-btn-primary-text);
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		transition: opacity 0.15s;
	}

	.primary:hover:not(:disabled) {
		opacity: 0.92;
	}

	.primary:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	.text-btn,
	.link-btn {
		border: none;
		background: none;
		padding: 0;
		font: inherit;
		cursor: pointer;
	}

	.text-btn {
		align-self: flex-start;
		font-size: 0.8rem;
		color: var(--color-text-subtle);
	}

	.text-btn:hover {
		color: var(--color-text);
	}

	.footer-switch {
		margin: 1.25rem 0 0;
		padding-top: 1rem;
		border-top: 1px solid var(--color-border);
		text-align: center;
		font-size: 0.82rem;
		color: var(--color-text-subtle);
	}

	.link-btn {
		color: var(--color-text);
		font-weight: 600;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.link-btn:hover {
		color: var(--color-link-hover);
	}

	.error {
		background: var(--color-error-bg-soft);
		border: 1px solid var(--color-error-border-soft);
		border-radius: 8px;
		padding: 0.65rem 0.85rem;
		color: var(--color-error-soft);
		font-size: 0.84rem;
		margin: 0 0 0.85rem;
	}

	@media (max-width: 640px) {
		.login-wrap {
			padding: 1rem;
			align-items: flex-start;
			padding-top: max(1rem, env(safe-area-inset-top));
		}

		.login-card {
			padding: 1.25rem;
			border-radius: 12px;
		}

		.panel h1 {
			font-size: 1.2rem;
		}
	}
</style>
