<script>
	import { enhance } from '$app/forms';
	import {
		Check,
		Copy,
		ExternalLink,
		KeyRound,
		RefreshCw,
		Save,
		Send,
		Settings,
		ShieldCheck,
		Trash2,
		TriangleAlert,
		Users,
		X
	} from '@lucide/svelte';
	import { ADMIN_INVALIDATE, withActionToast } from '$lib/action-toast.js';
	import PieceColor from '$lib/PieceColor.svelte';

	let { data, form } = $props();
	let activeTab = $state(/** @type {'settings' | 'users' | 'danger'} */ ('settings'));
	let toggling = $state(false);
	let savingName = $state(false);
	let togglingHttp = $state(false);
	let generatingKey = $state(false);
	let savingSlack = $state(false);
	let clearingSlack = $state(false);
	let testingSlack = $state(false);
	let processing = $state(/** @type {string | null} */ (null));
	let resettingPassword = $state(/** @type {string | null} */ (null));
	let deletingUser = $state(/** @type {string | null} */ (null));
	let resettingLadder = $state(false);
	let clubNameDraft = $state('');
	let slackWebhookDraft = $state('');
	let ladderConfirmText = $state('');

	$effect(() => {
		clubNameDraft = data.clubName;
	});

	/** @param {'settings' | 'users' | 'danger'} tab */
	const setTab = (tab) => {
		activeTab = tab;
	};

	/** @param {{ name: string }} user */
	const confirmDeleteUser = (user) =>
		confirm(
			`Delete ${user.name}? All of their matches will be removed and opponent ratings will be reverted where applicable. This cannot be undone.`
		);

	const confirmResetLadder = () =>
		confirm(
			'Reset the entire ladder? This permanently deletes every match and sets all players back to 1200 rating with zero wins, losses, and draws.'
		);

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

	<div class="tabs" role="tablist">
		<button
			type="button"
			role="tab"
			class="with-icon"
			class:active={activeTab === 'settings'}
			aria-selected={activeTab === 'settings'}
			onclick={() => setTab('settings')}
		>
			<Settings size={15} aria-hidden="true" />
			Settings
			{#if data.pendingMatches.length > 0}
				<span class="tab-badge">{data.pendingMatches.length}</span>
			{/if}
		</button>
		<button
			type="button"
			role="tab"
			class="with-icon"
			class:active={activeTab === 'users'}
			aria-selected={activeTab === 'users'}
			onclick={() => setTab('users')}
		>
			<Users size={15} aria-hidden="true" />
			Users
			<span class="tab-count">{data.users.length}</span>
		</button>
		<button
			type="button"
			role="tab"
			class="with-icon"
			class:active={activeTab === 'danger'}
			aria-selected={activeTab === 'danger'}
			onclick={() => setTab('danger')}
		>
			<TriangleAlert size={15} aria-hidden="true" />
			Danger zone
		</button>
	</div>

	{#if activeTab === 'settings'}
	<div class="tab-panel" role="tabpanel">
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
			<button type="submit" disabled={toggling} class="toggle-btn with-icon" class:danger={data.honorSystemEnabled}>
				<ShieldCheck size={15} aria-hidden="true" />
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
			<button type="submit" class="toggle-btn with-icon" disabled={savingName}>
				<Save size={15} aria-hidden="true" />
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
			<button type="submit" class="toggle-btn with-icon" disabled={savingSlack || !slackWebhookDraft.trim()}>
				<Save size={15} aria-hidden="true" />
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
				<button type="submit" class="toggle-btn with-icon" disabled={testingSlack || !data.slackWebhookConfigured}>
					<Send size={15} aria-hidden="true" />
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
					<button type="submit" class="toggle-btn danger with-icon" disabled={clearingSlack}>
						<Trash2 size={15} aria-hidden="true" />
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
				<button type="button" class="toggle-btn with-icon" onclick={() => copyApiKey(form.apiKey)}>
					<Copy size={15} aria-hidden="true" />
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
				<button type="submit" class="toggle-btn with-icon" disabled={generatingKey}>
					<RefreshCw size={15} aria-hidden="true" />
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
					class="toggle-btn with-icon"
					class:danger={data.httpSubmitEnabled}
				>
					<ShieldCheck size={15} aria-hidden="true" />
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
								<span class="player-name with-icon">
									<PieceColor color="white" size={10} />
									{match.whiteName}
								</span>
								<span class="vs">vs</span>
								<span class="player-name with-icon">
									<PieceColor color="black" size={10} />
									{match.blackName}
								</span>
							</div>
							<div class="match-meta">
								<span class="result-label">{result}</span>
								<span class="date">{new Date(match.playedAt).toLocaleDateString()}</span>
								<a href="/matches/{match._id}" class="view-link with-icon">
									View
									<ExternalLink size={13} aria-hidden="true" />
								</a>
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
									class="approve-btn with-icon"
									disabled={processing === match._id}
								>
									<Check size={14} aria-hidden="true" />
									{processing === match._id ? '…' : 'Approve'}
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
									class="reject-btn with-icon"
									disabled={processing === match._id}
								>
									<X size={14} aria-hidden="true" />
									Reject
								</button>
							</form>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</section>
	</div>
	{:else if activeTab === 'users'}
	<div class="tab-panel" role="tabpanel">
		<section class="card">
			<h2>Users</h2>
			<p class="description">
				Manage club members. Reset passwords or remove accounts. You cannot delete your own account
				or the only remaining admin.
			</p>

			{#if data.users.length === 0}
				<p class="empty">No users found.</p>
			{:else}
				<div class="users-table-wrap">
					<table class="users-table">
						<thead>
							<tr>
								<th>Name</th>
								<th>Username</th>
								<th>Rating</th>
								<th>Role</th>
								<th>Reset password</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{#each data.users as user (user._id)}
								<tr>
									<td>
										<a href="/players/{user._id}" class="user-link">{user.name}</a>
										{#if user.isSelf}
											<span class="you-badge">You</span>
										{/if}
									</td>
									<td class="mono">{user.username}</td>
									<td>{user.rating}</td>
									<td>
										{#if user.isAdmin}
											<span class="role-badge admin">Admin</span>
										{:else}
											<span class="role-badge">Player</span>
										{/if}
									</td>
									<td>
										<form
											method="POST"
											action="?/resetUserPassword"
											class="password-form"
											use:enhance={() => {
												resettingPassword = user._id;
												return async (ctx) => {
													await adminToast()(ctx);
													resettingPassword = null;
												};
											}}
										>
											<input type="hidden" name="playerId" value={user._id} />
											<input
												name="newPassword"
												type="password"
												minlength="4"
												placeholder="New password"
												autocomplete="new-password"
												required
											/>
											<button
												type="submit"
												class="toggle-btn with-icon"
												disabled={resettingPassword === user._id}
											>
												<KeyRound size={14} aria-hidden="true" />
												{resettingPassword === user._id ? 'Saving…' : 'Reset'}
											</button>
										</form>
									</td>
									<td>
										<form
											method="POST"
											action="?/deleteUser"
											onsubmit={(e) => {
												if (!confirmDeleteUser(user)) e.preventDefault();
											}}
											use:enhance={() => {
												deletingUser = user._id;
												return async (ctx) => {
													await adminToast()(ctx);
													deletingUser = null;
												};
											}}
										>
											<input type="hidden" name="playerId" value={user._id} />
											<button
												type="submit"
												class="toggle-btn danger with-icon"
												disabled={user.isSelf || deletingUser === user._id}
												title={user.isSelf ? 'You cannot delete your own account' : 'Delete user'}
											>
												<Trash2 size={14} aria-hidden="true" />
												{deletingUser === user._id ? 'Deleting…' : 'Delete'}
											</button>
										</form>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</section>
	</div>
	{:else}
	<div class="tab-panel" role="tabpanel">
		<section class="card danger-zone">
			<h2>Reset entire ladder</h2>
			<p class="description">
				Permanently delete <strong>all matches</strong> and reset every player's rating to
				<strong>1200</strong> with zero wins, losses, and draws. User accounts are kept.
				This cannot be undone.
			</p>
			<form
				method="POST"
				action="?/resetLadder"
				class="danger-form"
				onsubmit={(e) => {
					if (!confirmResetLadder()) e.preventDefault();
				}}
				use:enhance={() => {
					resettingLadder = true;
					return async (ctx) => {
						await adminToast()(ctx);
						resettingLadder = false;
						ladderConfirmText = '';
					};
				}}
			>
				<label>
					Type <code>RESET LADDER</code> to confirm
					<input
						name="confirmText"
						type="text"
						bind:value={ladderConfirmText}
						placeholder="RESET LADDER"
						autocomplete="off"
						spellcheck="false"
					/>
				</label>
				<button
					type="submit"
					class="toggle-btn danger with-icon"
					disabled={resettingLadder || ladderConfirmText !== 'RESET LADDER'}
				>
					<TriangleAlert size={15} aria-hidden="true" />
					{resettingLadder ? 'Resetting…' : 'Reset entire ladder'}
				</button>
			</form>
		</section>
	</div>
	{/if}
</div>

<style>
	.admin-page { display: flex; flex-direction: column; gap: 1.5rem; max-width: 960px; }
	h1 { margin: 0 0 0.5rem; font-size: 1.4rem; }
	h2 { margin: 0; font-size: 1rem; font-weight: 600; color: var(--color-heading); }

	.tabs {
		display: flex;
		gap: 0.25rem;
		border-bottom: 1px solid var(--color-border);
		flex-wrap: wrap;
	}
	.tabs button {
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		margin-bottom: -1px;
		padding: 8px 14px;
		font-size: 0.88rem;
		color: var(--color-tab-inactive);
		cursor: pointer;
		transition: color 0.15s, border-color 0.15s;
		font-family: inherit;
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}
	.tabs button:hover { color: var(--color-tab-hover); }
	.tabs button.active {
		color: var(--color-tab-active);
		border-bottom-color: var(--color-tab-active);
	}
	.tab-panel { display: flex; flex-direction: column; gap: 1.5rem; }
	.tab-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 18px;
		height: 18px;
		padding: 0 5px;
		background: var(--color-warning);
		color: var(--color-nav-text);
		border-radius: 10px;
		font-size: 0.68rem;
		font-weight: 700;
	}
	.tab-count {
		font-size: 0.75rem;
		color: var(--color-text-extra-dim);
	}

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
		display: inline-flex;
		align-items: center;
		gap: 6px;
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
	.view-link { color: var(--color-text-dim); text-decoration: none; display: inline-flex; align-items: center; gap: 0.25rem; }
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
		display: inline-flex;
		align-items: center;
		gap: 5px;
	}
	.approve-btn { background: var(--color-admin-approve-bg); color: var(--color-success); border: 1px solid var(--color-admin-approve-border); }
	.approve-btn:hover:not(:disabled) { background: var(--color-admin-approve-hover-bg); }
	.reject-btn { background: var(--color-admin-reject-bg); color: var(--color-error); border: 1px solid var(--color-admin-reject-border); }
	.reject-btn:hover:not(:disabled) { background: var(--color-admin-reject-hover-bg); }
	.approve-btn:disabled, .reject-btn:disabled { opacity: 0.4; cursor: not-allowed; }

	.users-table-wrap {
		overflow-x: auto;
		margin: 0 -0.25rem;
		padding: 0 0.25rem;
	}
	.users-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.85rem;
	}
	.users-table th,
	.users-table td {
		padding: 10px 8px;
		text-align: left;
		border-bottom: 1px solid var(--color-border-strong);
		vertical-align: middle;
	}
	.users-table th {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-faint);
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}
	.user-link {
		color: var(--color-heading);
		text-decoration: none;
		font-weight: 600;
	}
	.user-link:hover { color: var(--color-link-hover); }
	.you-badge {
		display: inline-block;
		margin-left: 6px;
		font-size: 0.68rem;
		font-weight: 600;
		padding: 2px 6px;
		border-radius: 10px;
		background: var(--color-surface-muted);
		color: var(--color-text-faint);
	}
	.mono { font-family: ui-monospace, monospace; font-size: 0.82rem; color: var(--color-text-muted); }
	.role-badge {
		display: inline-block;
		font-size: 0.72rem;
		font-weight: 600;
		padding: 3px 8px;
		border-radius: 12px;
		border: 1px solid var(--color-border-nav);
		color: var(--color-text-faint);
	}
	.role-badge.admin {
		color: var(--color-accent-gold);
		border-color: var(--color-accent-gold);
	}
	.password-form {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		align-items: center;
		min-width: 220px;
	}
	.password-form input {
		flex: 1 1 120px;
		min-width: 120px;
		background: var(--color-input-bg);
		border: 1px solid var(--color-border-strong);
		border-radius: 6px;
		color: var(--color-text);
		padding: 6px 8px;
		font-size: 0.82rem;
	}
	.danger-zone {
		border-color: var(--color-admin-reject-border);
		background: var(--color-admin-reject-bg);
	}
	.danger-form {
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
	}
	.danger-form label {
		display: flex;
		flex-direction: column;
		gap: 4px;
		font-size: 0.82rem;
		color: var(--color-text-subtle);
	}
	.danger-form input {
		background: var(--color-input-bg);
		border: 1px solid var(--color-border-strong);
		border-radius: 6px;
		color: var(--color-text);
		padding: 8px 10px;
		font-size: 0.9rem;
		max-width: 280px;
	}

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

		.password-form {
			flex-direction: column;
			align-items: stretch;
		}

		.password-form input,
		.password-form .toggle-btn {
			width: 100%;
		}
	}
</style>
