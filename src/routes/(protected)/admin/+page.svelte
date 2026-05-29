<script>
	import { enhance } from '$app/forms';
	import { ADMIN_INVALIDATE, withActionToast } from '$lib/action-toast.js';

	let { data, form } = $props();
	let toggling = $state(false);
	let savingName = $state(false);
	let togglingHttp = $state(false);
	let generatingKey = $state(false);
	let savingSlack = $state(false);
	let clearingSlack = $state(false);
	let testingSlack = $state(false);
	let processing = $state(/** @type {string | null} */ (null));
	let clubNameDraft = $state('');
	let slackWebhookDraft = $state('');

	$effect(() => {
		clubNameDraft = data.clubName;
	});

	const copyApiKey = async (key) => {
		try {
			await navigator.clipboard.writeText(key);
		} catch {
			// clipboard may be unavailable
		}
	};

	const adminToast = (extra = {}) => withActionToast({ invalidate: ADMIN_INVALIDATE, ...extra });
</script>

<svelte:head><title>Admin — Office Chess Club</title></svelte:head>

<div class="admin-page">
	<h1>Admin Panel</h1>

	{#if form?.error}
		<p class="error">{form.error}</p>
	{/if}

	<!-- Honor System Toggle -->
	<section class="card">
		<div class="section-header">
			<h2>Honor System</h2>
			<div class="toggle-status" class:on={data.honorSystemEnabled}>
				{data.honorSystemEnabled ? 'Enabled' : 'Disabled'}
			</div>
		</div>
		<p class="description">
			When <strong>enabled</strong>, match results are applied immediately without review.
			When <strong>disabled</strong>, every match requires admin approval before ratings update.
		</p>
		<form
			method="POST"
			action="?/toggleHonorSystem"
			use:enhance={() => {
				toggling = true;
				return async (ctx) => {
					await adminToast()(ctx);
					toggling = false;
				};
			}}
		>
			<button type="submit" disabled={toggling} class="toggle-btn" class:danger={data.honorSystemEnabled}>
				{toggling ? 'Updating…' : data.honorSystemEnabled ? 'Disable Honor System' : 'Enable Honor System'}
			</button>
		</form>
	</section>

	<section class="card">
		<h2>Club Name</h2>
		<p class="description">
			Used across the app header and login screen. Defaults to <strong>Office</strong> when empty.
		</p>
		<form
			method="POST"
			action="?/updateClubName"
			class="name-form"
			use:enhance={() => {
				savingName = true;
				return async (ctx) => {
					await adminToast()(ctx);
					savingName = false;
				};
			}}
		>
			<label>
				Club name
				<input name="clubName" type="text" maxlength="40" bind:value={clubNameDraft} placeholder="Office" />
			</label>
			<button type="submit" class="toggle-btn" disabled={savingName}>
				{savingName ? 'Saving…' : 'Save club name'}
			</button>
		</form>
		<p class="preview">Preview: <strong>{data.clubName} Chess Club</strong></p>
	</section>

	<section class="card">
		<div class="section-header">
			<h2>Slack Notifications</h2>
			<div class="toggle-status" class:on={data.slackWebhookConfigured}>
				{data.slackWebhookConfigured ? 'Configured' : 'Not configured'}
			</div>
		</div>
		<p class="description">
			Post match results and pending-match alerts to a Slack channel via an
			<a href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noopener noreferrer">incoming webhook</a>.
			You can also set <code>SLACK_WEBHOOK_URL</code> in the environment as a fallback.
		</p>
		{#if data.slackWebhookFromEnv && !data.slackWebhookStoredInDb}
			<p class="hint">Currently using the webhook from your environment variables.</p>
		{/if}
		<form
			method="POST"
			action="?/updateSlackWebhook"
			class="name-form"
			use:enhance={() => {
				savingSlack = true;
				return async (ctx) => {
					await adminToast()(ctx);
					slackWebhookDraft = '';
					savingSlack = false;
				};
			}}
		>
			<label>
				Slack webhook URL
				<input
					name="slackWebhookUrl"
					type="url"
					bind:value={slackWebhookDraft}
					placeholder="https://hooks.slack.com/services/…"
					autocomplete="off"
					spellcheck="false"
				/>
			</label>
			<button type="submit" class="toggle-btn" disabled={savingSlack || !slackWebhookDraft.trim()}>
				{savingSlack ? 'Saving…' : data.slackWebhookStoredInDb ? 'Update webhook' : 'Save webhook'}
			</button>
		</form>
		<div class="http-admin-actions">
			<form
				method="POST"
				action="?/testSlackWebhook"
				use:enhance={() => {
					testingSlack = true;
					return async (ctx) => {
						await adminToast()(ctx);
						testingSlack = false;
					};
				}}
			>
				<button type="submit" class="toggle-btn" disabled={testingSlack || !data.slackWebhookConfigured}>
					{testingSlack ? 'Sending…' : 'Send test notification'}
				</button>
			</form>
			{#if data.slackWebhookStoredInDb}
				<form
					method="POST"
					action="?/clearSlackWebhook"
					use:enhance={() => {
						clearingSlack = true;
						return async (ctx) => {
							await adminToast()(ctx);
							slackWebhookDraft = '';
							clearingSlack = false;
						};
					}}
				>
					<button type="submit" class="toggle-btn danger" disabled={clearingSlack}>
						{clearingSlack ? 'Removing…' : 'Remove saved webhook'}
					</button>
				</form>
			{/if}
		</div>
	</section>

	<section class="card">
		<div class="section-header">
			<h2>HTTP Match Submission</h2>
			<div class="toggle-status" class:on={data.httpSubmitEnabled}>
				{data.httpSubmitEnabled ? 'Enabled' : 'Disabled'}
			</div>
		</div>
		<p class="description">
			When <strong>enabled</strong>, scripts and third-party tools can log matches via
			<code>POST /api/matches</code> using a bearer token. Off by default — generate a key,
			then enable when you are ready.
		</p>
		{#if form?.apiKey}
			<div class="api-key-reveal">
				<p class="api-key-label">New API key (copy now — shown once):</p>
				<code class="api-key-value">{form.apiKey}</code>
				<button type="button" class="toggle-btn" onclick={() => copyApiKey(form.apiKey)}>
					Copy key
				</button>
			</div>
		{/if}
		<div class="http-admin-actions">
			<form
				method="POST"
				action="?/generateHttpSubmitKey"
				use:enhance={() => {
					generatingKey = true;
					return async (ctx) => {
						await adminToast()(ctx);
						generatingKey = false;
					};
				}}
			>
				<button type="submit" class="toggle-btn" disabled={generatingKey}>
					{generatingKey ? 'Generating…' : data.httpSubmitHasKey ? 'Regenerate API key' : 'Generate API key'}
				</button>
			</form>
			<form
				method="POST"
				action="?/toggleHttpSubmit"
				use:enhance={() => {
					togglingHttp = true;
					return async (ctx) => {
						await adminToast()(ctx);
						togglingHttp = false;
					};
				}}
			>
				<button
					type="submit"
					disabled={togglingHttp || (!data.httpSubmitEnabled && !data.httpSubmitHasKey)}
					class="toggle-btn"
					class:danger={data.httpSubmitEnabled}
				>
					{togglingHttp
						? 'Updating…'
						: data.httpSubmitEnabled
							? 'Disable HTTP submissions'
							: 'Enable HTTP submissions'}
				</button>
			</form>
		</div>
		{#if !data.httpSubmitHasKey}
			<p class="hint">Generate an API key before enabling.</p>
		{/if}
	</section>

	<!-- Pending Matches Queue -->
	<section class="card">
		<h2>
			Pending Matches
			{#if data.pendingMatches.length > 0}
				<span class="count-badge">{data.pendingMatches.length}</span>
			{/if}
		</h2>

		{#if data.pendingMatches.length === 0}
			<p class="empty">No matches awaiting approval.</p>
		{:else}
			<div class="match-queue">
				{#each data.pendingMatches as match}
					{@const isDraw = match.isDraw}
					{@const result = isDraw ? 'Draw'
						: match.winnerId === match.whitePlayerId
							? `${match.whiteName} wins`
							: `${match.blackName} wins`}
					{@const wd = match.eloChange.white.after - match.eloChange.white.before}
					{@const bd = match.eloChange.black.after - match.eloChange.black.before}
					<div class="queue-item">
						<div class="match-summary">
							<div class="matchup">
								<span class="player-name">⬜ {match.whiteName}</span>
								<span class="vs">vs</span>
								<span class="player-name">⬛ {match.blackName}</span>
							</div>
							<div class="match-meta">
								<span class="result-label">{result}</span>
								<span class="date">{new Date(match.playedAt).toLocaleDateString()}</span>
								<a href="/matches/{match._id}" class="view-link">View →</a>
							</div>
							<div class="elo-preview">
								<span class="elo-label">Est. Elo change:</span>
								<span class="elo-val" class:pos={wd > 0} class:neg={wd < 0}>
									{match.whiteName}: {wd >= 0 ? '+' : ''}{wd}
								</span>
								<span class="elo-val" class:pos={bd > 0} class:neg={bd < 0}>
									{match.blackName}: {bd >= 0 ? '+' : ''}{bd}
								</span>
							</div>
						</div>
						<div class="actions">
							<form
								method="POST"
								action="?/approveMatch"
								use:enhance={() => {
									processing = match._id;
									return async (ctx) => {
										await adminToast()(ctx);
										processing = null;
									};
								}}
							>
								<input type="hidden" name="matchId" value={match._id} />
								<button
									type="submit"
									class="approve-btn"
									disabled={processing === match._id}
								>
									{processing === match._id ? '…' : '✓ Approve'}
								</button>
							</form>
							<form
								method="POST"
								action="?/rejectMatch"
								use:enhance={() => {
									processing = match._id;
									return async (ctx) => {
										await adminToast()(ctx);
										processing = null;
									};
								}}
							>
								<input type="hidden" name="matchId" value={match._id} />
								<button
									type="submit"
									class="reject-btn"
									disabled={processing === match._id}
								>
									✗ Reject
								</button>
							</form>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</section>
</div>

<style>
	.admin-page { display: flex; flex-direction: column; gap: 1.5rem; max-width: 700px; }
	h1 { margin: 0 0 0.5rem; font-size: 1.4rem; }
	h2 { margin: 0; font-size: 1rem; font-weight: 600; color: var(--color-heading); }

	.card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 12px;
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.section-header { display: flex; align-items: center; gap: 1rem; justify-content: space-between; }
	.toggle-status {
		font-size: 0.78rem;
		font-weight: 600;
		padding: 3px 10px;
		border-radius: 20px;
		border: 1px solid var(--color-border-nav);
		color: var(--color-text-faint);
	}
	.toggle-status.on { color: var(--color-success); border-color: var(--color-badge-win-border); background: var(--color-admin-toggle-on-bg); }

	.description { font-size: 0.85rem; color: var(--color-text-faint); margin: 0; line-height: 1.5; }
	.name-form { display: flex; flex-direction: column; gap: 0.65rem; }
	.name-form label { display: flex; flex-direction: column; gap: 4px; font-size: 0.82rem; color: var(--color-text-subtle); }
	.name-form input {
		background: var(--color-input-bg);
		border: 1px solid var(--color-border-strong);
		border-radius: 6px;
		color: var(--color-text);
		padding: 8px 10px;
		font-size: 0.9rem;
	}
	.preview { margin: 0; font-size: 0.82rem; color: var(--color-text-faint); }

	.http-admin-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.api-key-reveal {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 10px 12px;
		background: var(--color-bg);
		border: 1px solid var(--color-border-strong);
		border-radius: 8px;
	}

	.api-key-label {
		margin: 0;
		font-size: 0.82rem;
		color: var(--color-text-faint);
	}

	.api-key-value {
		font-size: 0.78rem;
		word-break: break-all;
		color: var(--color-text-muted);
	}

	.hint {
		margin: 0;
		font-size: 0.8rem;
		color: var(--color-text-extra-dim);
	}

	.toggle-btn {
		background: var(--color-surface-muted);
		border: 1px solid var(--color-border-nav);
		color: var(--color-text-soft);
		border-radius: 6px;
		padding: 8px 16px;
		font-size: 0.88rem;
		cursor: pointer;
		transition: all 0.15s;
		align-self: flex-start;
	}
	.toggle-btn:hover:not(:disabled) { border-color: var(--color-text-dim); color: var(--color-link-hover); }
	.toggle-btn.danger { border-color: var(--color-admin-reject-border); color: var(--color-error); }
	.toggle-btn.danger:hover:not(:disabled) { background: var(--color-admin-danger-hover-bg); }
	.toggle-btn:disabled { opacity: 0.4; cursor: not-allowed; }

	.count-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		background: var(--color-warning);
		color: var(--color-nav-text);
		border-radius: 50%;
		font-size: 0.72rem;
		font-weight: 700;
		margin-left: 6px;
	}

	.empty { color: var(--color-text-dim); font-size: 0.9rem; margin: 0; }
	.error { color: var(--color-error); background: var(--color-error-bg); border: 1px solid var(--color-error-border); border-radius: 6px; padding: 8px 10px; font-size: 0.85rem; }

	.match-queue { display: flex; flex-direction: column; gap: 10px; }
	.queue-item {
		background: var(--color-bg);
		border: 1px solid var(--color-border-strong);
		border-radius: 8px;
		padding: 12px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}
	.match-summary { display: flex; flex-direction: column; gap: 4px; flex: 1; }
	.matchup { display: flex; align-items: center; gap: 8px; font-size: 0.92rem; }
	.player-name { font-weight: 600; color: var(--color-heading); }
	.vs { color: var(--color-text-extra-dim); font-size: 0.8rem; }
	.match-meta { display: flex; align-items: center; gap: 12px; font-size: 0.8rem; color: var(--color-text-faint); }
	.result-label { color: var(--color-text-muted); }
	.view-link { color: var(--color-text-dim); text-decoration: none; }
	.view-link:hover { color: var(--color-text-muted); }

	.elo-preview { display: flex; align-items: center; gap: 10px; font-size: 0.78rem; flex-wrap: wrap; }
	.elo-label { color: var(--color-text-extra-dim); }
	.elo-val { font-weight: 600; }
	.elo-val.pos { color: var(--color-success); }
	.elo-val.neg { color: var(--color-error); }

	.actions { display: flex; gap: 8px; }
	.approve-btn, .reject-btn {
		border: none;
		border-radius: 5px;
		padding: 6px 12px;
		font-size: 0.82rem;
		font-weight: 600;
		cursor: pointer;
		transition: opacity 0.15s;
	}
	.approve-btn { background: var(--color-admin-approve-bg); color: var(--color-success); border: 1px solid var(--color-admin-approve-border); }
	.approve-btn:hover:not(:disabled) { background: var(--color-admin-approve-hover-bg); }
	.reject-btn { background: var(--color-admin-reject-bg); color: var(--color-error); border: 1px solid var(--color-admin-reject-border); }
	.reject-btn:hover:not(:disabled) { background: var(--color-admin-reject-hover-bg); }
	.approve-btn:disabled, .reject-btn:disabled { opacity: 0.4; cursor: not-allowed; }

	@media (max-width: 640px) {
		.admin-page {
			max-width: none;
		}

		.section-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.queue-item {
			flex-direction: column;
			align-items: stretch;
		}

		.matchup {
			flex-wrap: wrap;
		}

		.match-meta {
			flex-wrap: wrap;
			gap: 8px;
		}

		.actions {
			width: 100%;
			flex-direction: column;
		}

		.actions form {
			width: 100%;
		}

		.approve-btn,
		.reject-btn {
			width: 100%;
			padding: 10px;
		}

		.toggle-btn {
			width: 100%;
			text-align: center;
		}
	}
</style>
