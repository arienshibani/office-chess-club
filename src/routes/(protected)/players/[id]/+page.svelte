<script>
	import { browser } from '$app/environment';
	import { enhance } from '$app/forms';
	import ColorWinRateChart from '$lib/ColorWinRateChart.svelte';
	import EmojiPicker from '$lib/EmojiPicker.svelte';
	import PlayerAvatar from '$lib/PlayerAvatar.svelte';
	import { computeColorStats } from '$lib/player-stats.js';
	import { applyTheme, normalizeTheme } from '$lib/theme.js';

	let { data, form } = $props();
	let { player, matches, rank, isOwnProfile } = $derived(data);

	let totalGames = $derived(player.stats.wins + player.stats.losses + player.stats.draws);
	let winRate = $derived(totalGames > 0 ? Math.round((player.stats.wins / totalGames) * 100) : 0);
	let colorStats = $derived(computeColorStats(matches));

	let editName = $state('');
	let editIcon = $state('');
	let editTheme = $state(/** @type {'light' | 'dark'} */ ('dark'));
	let savingProfile = $state(false);
	let savingPassword = $state(false);
	let activeTab = $state(/** @type {'profile' | 'history' | 'account'} */ ('profile'));

	$effect(() => {
		editName = player.name;
		editIcon = player.icon;
		editTheme = normalizeTheme(player.theme);
	});

	$effect(() => {
		if (form?.action === 'updateProfile') activeTab = 'profile';
		if (form?.action === 'changePassword') activeTab = 'account';
	});

	/** @param {'profile' | 'history' | 'account'} tab */
	const setTab = (tab) => {
		activeTab = tab;
	};

	/** @param {'light' | 'dark'} theme */
	const selectTheme = (theme) => {
		editTheme = theme;
		if (browser) applyTheme(theme);
	};
</script>

<svelte:head><title>{player.name} — Office Chess Club</title></svelte:head>

<div class="profile">
	<div class="header-card">
		<PlayerAvatar
			icon={player.icon}
			avatarUrl={player.avatarUrl}
			size={72}
			placeholder="♟"
			alt={player.name}
			class="profile-avatar"
		/>
		<div class="info">
			<h1>{player.name}</h1>
			<div class="meta">
				<span class="rating">{player.rating}</span>
				<span class="rank">Rank #{rank}</span>
			</div>
		</div>
	</div>

	{#if isOwnProfile}
		<div class="tabs" role="tablist">
			<button
				type="button"
				role="tab"
				class:active={activeTab === 'profile'}
				aria-selected={activeTab === 'profile'}
				onclick={() => setTab('profile')}
			>
				Profile
			</button>
			<button
				type="button"
				role="tab"
				class:active={activeTab === 'history'}
				aria-selected={activeTab === 'history'}
				onclick={() => setTab('history')}
			>
				Match History
			</button>
			<button
				type="button"
				role="tab"
				class:active={activeTab === 'account'}
				aria-selected={activeTab === 'account'}
				onclick={() => setTab('account')}
			>
				Account
			</button>
		</div>

		{#if activeTab === 'profile'}
			<div class="tab-panel" role="tabpanel">
				<div class="stats-grid">
					<div class="stat-card">
						<div class="stat-val wins">{player.stats.wins}</div>
						<div class="stat-label">Wins</div>
					</div>
					<div class="stat-card">
						<div class="stat-val losses">{player.stats.losses}</div>
						<div class="stat-label">Losses</div>
					</div>
					<div class="stat-card">
						<div class="stat-val draws">{player.stats.draws}</div>
						<div class="stat-label">Draws</div>
					</div>
					<div class="stat-card">
						<div class="stat-val">{totalGames}</div>
						<div class="stat-label">Games</div>
					</div>
					<div class="stat-card">
						<div class="stat-val">{winRate}%</div>
						<div class="stat-label">Win rate</div>
					</div>
				</div>

				<section class="color-stats-card">
					<h2>Win rate by color</h2>
					<ColorWinRateChart stats={colorStats} />
				</section>

				<section class="settings-card">
					<h2>Edit profile</h2>
					{#if form?.action === 'updateProfile' && form?.profileError}
						<p class="error">{form.profileError}</p>
					{/if}
					{#if form?.action === 'updateProfile' && form?.profileSuccess}
						<p class="success">Profile updated.</p>
					{/if}
					<form
						method="POST"
						action="?/updateProfile"
						class="settings-form"
						use:enhance={() => {
							savingProfile = true;
							return async ({ update }) => {
								await update();
								savingProfile = false;
							};
						}}
					>
						<label>
							Display name
							<input type="text" name="name" bind:value={editName} required maxlength="80" />
						</label>
						<label>
							Icon (emoji)
							<EmojiPicker name="icon" bind:value={editIcon} />
						</label>
						<fieldset class="theme-fieldset">
							<legend>Appearance</legend>
							<div class="theme-options" role="group" aria-label="Color theme">
								<button
									type="button"
									class:active={editTheme === 'dark'}
									aria-pressed={editTheme === 'dark'}
									onclick={() => selectTheme('dark')}
								>
									Dark
								</button>
								<button
									type="button"
									class:active={editTheme === 'light'}
									aria-pressed={editTheme === 'light'}
									onclick={() => selectTheme('light')}
								>
									Light
								</button>
							</div>
							<input type="hidden" name="theme" value={editTheme} />
						</fieldset>
						<button type="submit" disabled={savingProfile}>
							{savingProfile ? 'Saving…' : 'Save profile'}
						</button>
					</form>
				</section>
			</div>
		{:else if activeTab === 'history'}
			<div class="tab-panel" role="tabpanel">
				<section class="match-history">
					<table class="match-table">
						<thead>
							<tr>
								<th>Opponent</th>
								<th>Color</th>
								<th>Result</th>
								<th>Elo</th>
								<th>Date</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{#each matches as m}
								<tr class:pending={m.status === 'pending'}>
									<td>
										<a href="/players/{m.opponentId}" class="opp-link">
											<PlayerAvatar
												icon={m.opponentIcon}
												avatarUrl={m.opponentAvatar}
												size={20}
											/>
											{m.opponentName}
										</a>
									</td>
									<td class="color-cell">{m.isWhite ? '⬜ White' : '⬛ Black'}</td>
									<td>
										{#if m.status === 'pending'}
											<span class="badge pending-badge">⚠ Pending</span>
										{:else if m.isDraw}
											<span class="badge draw-badge">½ Draw</span>
										{:else if m.won}
											<span class="badge win-badge">✓ Win</span>
										{:else}
											<span class="badge loss-badge">✗ Loss</span>
										{/if}
									</td>
									<td class="elo-cell" class:pos={m.eloChange > 0} class:neg={m.eloChange < 0}>
										{m.status === 'pending' ? '~' : ''}{m.eloChange >= 0 ? '+' : ''}{m.eloChange}
									</td>
									<td class="date-cell">{new Date(m.playedAt).toLocaleDateString()}</td>
									<td><a href="/matches/{m._id}" class="view-link">View</a></td>
								</tr>
							{:else}
								<tr><td colspan="6" class="empty">No matches yet.</td></tr>
							{/each}
						</tbody>
					</table>
				</section>
			</div>
		{:else}
			<div class="tab-panel" role="tabpanel">
				<section class="settings-card">
					<h2>Change password</h2>
					{#if form?.action === 'changePassword' && form?.passwordError}
						<p class="error">{form.passwordError}</p>
					{/if}
					{#if form?.action === 'changePassword' && form?.passwordSuccess}
						<p class="success">Password updated.</p>
					{/if}
					<form
						method="POST"
						action="?/changePassword"
						class="settings-form"
						use:enhance={() => {
							savingPassword = true;
							return async ({ update }) => {
								await update();
								savingPassword = false;
							};
						}}
					>
						<label>
							Current password
							<input type="password" name="currentPassword" required autocomplete="current-password" />
						</label>
						<label>
							New password
							<input type="password" name="newPassword" required minlength="4" autocomplete="new-password" />
						</label>
						<label>
							Confirm new password
							<input type="password" name="confirmPassword" minlength="4" autocomplete="new-password" />
						</label>
						<button type="submit" disabled={savingPassword}>
							{savingPassword ? 'Updating…' : 'Change password'}
						</button>
					</form>
				</section>
			</div>
		{/if}
	{:else}
		<div class="stats-grid">
			<div class="stat-card">
				<div class="stat-val wins">{player.stats.wins}</div>
				<div class="stat-label">Wins</div>
			</div>
			<div class="stat-card">
				<div class="stat-val losses">{player.stats.losses}</div>
				<div class="stat-label">Losses</div>
			</div>
			<div class="stat-card">
				<div class="stat-val draws">{player.stats.draws}</div>
				<div class="stat-label">Draws</div>
			</div>
			<div class="stat-card">
				<div class="stat-val">{totalGames}</div>
				<div class="stat-label">Games</div>
			</div>
			<div class="stat-card">
				<div class="stat-val">{winRate}%</div>
				<div class="stat-label">Win rate</div>
			</div>
		</div>

		<section class="color-stats-card">
			<h2>Win rate by color</h2>
			<ColorWinRateChart stats={colorStats} />
		</section>

		<section class="match-history">
			<h2>Match History</h2>
			<table class="match-table">
				<thead>
					<tr>
						<th>Opponent</th>
						<th>Color</th>
						<th>Result</th>
						<th>Elo</th>
						<th>Date</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each matches as m}
						<tr class:pending={m.status === 'pending'}>
							<td>
								<a href="/players/{m.opponentId}" class="opp-link">
									<PlayerAvatar
										icon={m.opponentIcon}
										avatarUrl={m.opponentAvatar}
										size={20}
									/>
									{m.opponentName}
								</a>
							</td>
							<td class="color-cell">{m.isWhite ? '⬜ White' : '⬛ Black'}</td>
							<td>
								{#if m.status === 'pending'}
									<span class="badge pending-badge">⚠ Pending</span>
								{:else if m.isDraw}
									<span class="badge draw-badge">½ Draw</span>
								{:else if m.won}
									<span class="badge win-badge">✓ Win</span>
								{:else}
									<span class="badge loss-badge">✗ Loss</span>
								{/if}
							</td>
							<td class="elo-cell" class:pos={m.eloChange > 0} class:neg={m.eloChange < 0}>
								{m.status === 'pending' ? '~' : ''}{m.eloChange >= 0 ? '+' : ''}{m.eloChange}
							</td>
							<td class="date-cell">{new Date(m.playedAt).toLocaleDateString()}</td>
							<td><a href="/matches/{m._id}" class="view-link">View</a></td>
						</tr>
					{:else}
						<tr><td colspan="6" class="empty">No matches yet.</td></tr>
					{/each}
				</tbody>
			</table>
		</section>
	{/if}
</div>

<style>
	.profile { display: flex; flex-direction: column; gap: 1.5rem; }

	.header-card {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 14px;
		padding: 1.5rem;
	}
	:global(.profile-avatar.player-img),
	:global(.profile-avatar.player-placeholder),
	:global(.profile-avatar.player-emoji) {
		border-radius: 50%;
	}
	h1 { margin: 0 0 6px; font-size: 1.4rem; }
	.meta { display: flex; gap: 1rem; align-items: center; }
	.rating { font-size: 1.4rem; font-weight: 700; color: var(--color-accent-gold); }
	.rank { color: var(--color-text-subtle); font-size: 0.9rem; }

	.tabs {
		display: flex;
		gap: 0.25rem;
		border-bottom: 1px solid var(--color-border);
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
	}
	.tabs button:hover { color: var(--color-tab-hover); }
	.tabs button.active {
		color: var(--color-tab-active);
		border-bottom-color: var(--color-tab-active);
	}
	.tab-panel { display: flex; flex-direction: column; gap: 1.5rem; }

	.settings-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 14px;
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.color-stats-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 14px;
		padding: 1.25rem;
	}
	.color-stats-card h2 {
		margin: 0 0 1rem;
		font-size: 1rem;
		color: var(--color-text-muted);
	}
	.settings-card h2 {
		margin: 0;
		font-size: 1rem;
		color: var(--color-text-muted);
	}
	.settings-form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 4px;
		font-size: 0.82rem;
		color: var(--color-text-subtle);
	}
	input {
		background: var(--color-input-bg);
		border: 1px solid var(--color-border-strong);
		border-radius: 6px;
		color: var(--color-text);
		padding: 8px 10px;
		font-size: 0.9rem;
		font-family: inherit;
	}
	input:focus { outline: 1px solid var(--color-border-focus); }
	button[type="submit"] {
		align-self: flex-start;
		background: var(--color-btn-primary-bg);
		color: var(--color-btn-primary-text);
		border: none;
		border-radius: 6px;
		padding: 8px 14px;
		font-weight: 600;
		font-size: 0.88rem;
		cursor: pointer;
	}
	button[type="submit"]:disabled { opacity: 0.4; cursor: not-allowed; }
	.error {
		margin: 0;
		font-size: 0.82rem;
		color: var(--color-error);
		background: var(--color-error-bg);
		border: 1px solid var(--color-error-border);
		border-radius: 6px;
		padding: 8px 10px;
	}
	.success {
		margin: 0;
		font-size: 0.82rem;
		color: var(--color-success);
		background: var(--color-success-bg);
		border: 1px solid var(--color-success-border);
		border-radius: 6px;
		padding: 8px 10px;
	}

	.theme-fieldset {
		border: 1px solid var(--color-border);
		border-radius: 6px;
		padding: 8px 12px;
		margin: 0;
	}
	.theme-fieldset legend {
		font-size: 0.82rem;
		color: var(--color-text-subtle);
		padding: 0 4px;
	}
	.theme-options {
		display: flex;
		gap: 0.5rem;
	}
	.theme-options button {
		flex: 1;
		background: var(--color-input-bg);
		border: 1px solid var(--color-border-strong);
		border-radius: 6px;
		color: var(--color-text-muted);
		padding: 8px 10px;
		font-size: 0.88rem;
		cursor: pointer;
	}
	.theme-options button.active {
		background: var(--color-theme-option-active-bg);
		border-color: var(--color-border-focus);
		color: var(--color-text);
		font-weight: 600;
	}

	.stats-grid {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}
	.stat-card {
		flex: 1;
		min-width: 80px;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 10px;
		padding: 1rem;
		text-align: center;
	}
	.stat-val { font-size: 1.5rem; font-weight: 700; }
	.stat-val.wins { color: var(--color-success); }
	.stat-val.losses { color: var(--color-error); }
	.stat-val.draws { color: var(--color-text-muted); }
	.stat-label { font-size: 0.75rem; color: var(--color-text-faint); margin-top: 2px; }

	h2 { margin: 0 0 0.75rem; font-size: 1rem; color: var(--color-text-muted); }
	.match-table { width: 100%; border-collapse: collapse; }
	.match-table th {
		text-align: left;
		padding: 8px 10px;
		font-size: 0.75rem;
		color: var(--color-text-dim);
		border-bottom: 1px solid var(--color-border);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.match-table td { padding: 8px 10px; font-size: 0.87rem; border-bottom: 1px solid var(--color-border-row); }
	.match-table tr:hover td { background: var(--color-surface); }
	.match-table tr.pending td { opacity: 0.7; }

	.opp-link { display: flex; align-items: center; gap: 6px; text-decoration: none; color: inherit; }
	.opp-link:hover { color: var(--color-link-hover); }

	.color-cell { color: var(--color-text-faint); font-size: 0.82rem; }
	.elo-cell { font-weight: 600; }
	.elo-cell.pos { color: var(--color-success); }
	.elo-cell.neg { color: var(--color-error); }
	.date-cell { color: var(--color-text-dim); font-size: 0.8rem; }

	.view-link { color: var(--color-text-dim); text-decoration: none; font-size: 0.8rem; }
	.view-link:hover { color: var(--color-text-muted); }
	.empty { color: var(--color-text-dim); text-align: center; padding: 1.5rem; }

	.badge {
		display: inline-block;
		padding: 2px 7px;
		border-radius: 4px;
		font-size: 0.78rem;
		font-weight: 500;
	}
	.win-badge { background: var(--color-badge-win-bg); color: var(--color-success); border: 1px solid var(--color-badge-win-border); }
	.loss-badge { background: var(--color-badge-loss-bg); color: var(--color-error); border: 1px solid var(--color-badge-loss-border); }
	.draw-badge { background: var(--color-badge-draw-bg); color: var(--color-text-muted); border: 1px solid var(--color-badge-draw-border); }
	.pending-badge { background: var(--color-badge-pending-bg); color: var(--color-warning); border: 1px solid var(--color-badge-pending-border); }
</style>
