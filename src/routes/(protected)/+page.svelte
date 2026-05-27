<script>
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let whiteId = $state('');
	let blackId = $state('');
	let result = $state('white');
	let notation = $state('');
	let submitting = $state(false);
	let successMsg = $state('');

	$effect(() => {
		if (form?.success) {
			successMsg = form.status === 'approved'
				? 'Match logged and ratings updated!'
				: 'Match submitted — pending admin approval.';
			whiteId = '';
			blackId = '';
			result = 'white';
			notation = '';
		}
	});

	/** @param {number} r */
	function ratingColor(r) {
		if (r >= 1400) return '#f0c040';
		if (r >= 1300) return '#a0c8ff';
		return '#aaa';
	}

	/**
	 * @param {{ isDraw: boolean, winnerId: string|null, whitePlayerId: string, blackPlayerId: string, whiteName: string, blackName: string, status: string, eloChange: any }} match
	 */
	function matchSummary(match) {
		if (match.isDraw) return `${match.whiteName} ½–½ ${match.blackName}`;
		const winner = match.winnerId === match.whitePlayerId ? match.whiteName : match.blackName;
		const loser = match.winnerId === match.whitePlayerId ? match.blackName : match.whiteName;
		return `${winner} defeated ${loser}`;
	}

	/** @param {{ status: string, eloChange: { white: { before: number, after: number }, black: { before: number, after: number } } }} match */
	function eloDisplay(match) {
		const prefix = match.status === 'pending' ? '~' : '';
		const wd = match.eloChange.white.after - match.eloChange.white.before;
		const bd = match.eloChange.black.after - match.eloChange.black.before;
		return `${prefix}${wd >= 0 ? '+' : ''}${wd} / ${prefix}${bd >= 0 ? '+' : ''}${bd}`;
	}
</script>

<svelte:head><title>Leaderboard — Office Chess Club</title></svelte:head>

<div class="dashboard">
	<section class="leaderboard-section">
		<h2>Leaderboard</h2>
		<table class="leaderboard">
			<thead>
				<tr>
					<th>#</th>
					<th>Player</th>
					<th>Rating</th>
					<th>W</th>
					<th>L</th>
					<th>D</th>
					<th>Games</th>
				</tr>
			</thead>
			<tbody>
				{#each data.leaderboard as player, i}
					{@const games = player.stats.wins + player.stats.losses + player.stats.draws}
					<tr>
						<td class="rank">{i + 1}</td>
						<td>
							<a href="/players/{player._id}" class="player-link">
								{#if player.avatarUrl}
									<img src={player.avatarUrl} alt="" class="av" />
								{/if}
								{player.name}
							</a>
						</td>
						<td class="rating" style="color: {ratingColor(player.rating)}">{player.rating}</td>
						<td class="stat">{player.stats.wins}</td>
						<td class="stat">{player.stats.losses}</td>
						<td class="stat">{player.stats.draws}</td>
						<td class="stat muted">{games}</td>
					</tr>
				{:else}
					<tr><td colspan="7" class="empty">No players yet.</td></tr>
				{/each}
			</tbody>
		</table>
	</section>

	<div class="side-panel">
		<section class="log-match">
			<h2>Log a Match</h2>
			{#if !data.honorSystemEnabled}
				<p class="notice">Honor system is off — matches require admin approval.</p>
			{/if}
			{#if form?.error}
				<p class="error">{form.error}</p>
			{/if}
			{#if successMsg}
				<p class="success">{successMsg}</p>
			{/if}
			<form
				method="POST"
				action="?/logMatch"
				use:enhance={() => {
					submitting = true;
					successMsg = '';
					return async ({ update }) => {
						await update();
						submitting = false;
					};
				}}
			>
				<label>
					White
					<select name="whiteId" bind:value={whiteId} required>
						<option value="">Select player…</option>
						{#each data.allPlayers as p}
							<option value={p._id}>{p.name} ({p.rating})</option>
						{/each}
					</select>
				</label>
				<label>
					Black
					<select name="blackId" bind:value={blackId} required>
						<option value="">Select player…</option>
						{#each data.allPlayers as p}
							<option value={p._id}>{p.name} ({p.rating})</option>
						{/each}
					</select>
				</label>
				<fieldset>
					<legend>Result</legend>
					<label class="radio">
						<input type="radio" name="result" value="white" bind:group={result} /> White wins
					</label>
					<label class="radio">
						<input type="radio" name="result" value="black" bind:group={result} /> Black wins
					</label>
					<label class="radio">
						<input type="radio" name="result" value="draw" bind:group={result} /> Draw
					</label>
				</fieldset>
				<label>
					PGN / FEN (optional)
					<textarea name="notation" bind:value={notation} rows="3" placeholder="Paste PGN moves or FEN position…"></textarea>
				</label>
				<button type="submit" disabled={submitting}>
					{submitting ? 'Saving…' : 'Log Match'}
				</button>
			</form>
		</section>

		<section class="recent-matches">
			<h2>Recent Matches</h2>
			<ul class="match-feed">
				{#each data.recentMatches as match}
					<li class="match-item" class:pending={match.status === 'pending'}>
						<a href="/matches/{match._id}" class="match-link">
							<span class="summary">{matchSummary(match)}</span>
							<span class="elo-shift">{eloDisplay(match)}</span>
						</a>
						{#if match.status === 'pending'}
							<span class="badge pending-badge">⚠ Pending Approval</span>
						{/if}
					</li>
				{:else}
					<li class="empty">No matches yet.</li>
				{/each}
			</ul>
		</section>
	</div>
</div>

<style>
	.dashboard {
		display: grid;
		grid-template-columns: 1fr 340px;
		gap: 2rem;
		align-items: start;
	}
	@media (max-width: 800px) {
		.dashboard { grid-template-columns: 1fr; }
	}
	h2 { margin: 0 0 1rem; font-size: 1.1rem; font-weight: 600; color: #e0e0e0; }

	/* Leaderboard */
	.leaderboard { width: 100%; border-collapse: collapse; }
	.leaderboard th {
		text-align: left;
		padding: 8px 10px;
		font-size: 0.78rem;
		color: #666;
		border-bottom: 1px solid #222;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.leaderboard td {
		padding: 9px 10px;
		border-bottom: 1px solid #1a1a1a;
		font-size: 0.9rem;
	}
	.leaderboard tbody tr:hover td { background: #161616; }
	.rank { color: #555; font-size: 0.8rem; width: 30px; }
	.rating { font-weight: 700; font-size: 1rem; }
	.stat { color: #aaa; text-align: center; }
	.muted { color: #555; }
	.player-link {
		display: flex;
		align-items: center;
		gap: 8px;
		text-decoration: none;
		color: inherit;
	}
	.player-link:hover { color: #fff; }
	.av {
		width: 24px;
		height: 24px;
		border-radius: 50%;
	}
	.empty { color: #555; padding: 1rem; text-align: center; }

	/* Side panel */
	.side-panel { display: flex; flex-direction: column; gap: 1.5rem; }

	/* Log match form */
	.log-match, .recent-matches {
		background: #141414;
		border: 1px solid #222;
		border-radius: 12px;
		padding: 1.25rem;
	}
	form { display: flex; flex-direction: column; gap: 0.75rem; }
	label { display: flex; flex-direction: column; gap: 4px; font-size: 0.82rem; color: #888; }
	select, textarea {
		background: #0f0f0f;
		border: 1px solid #2a2a2a;
		border-radius: 6px;
		color: #f0f0f0;
		padding: 8px 10px;
		font-size: 0.9rem;
		font-family: inherit;
	}
	select:focus, textarea:focus { outline: 1px solid #444; }
	fieldset { border: 1px solid #222; border-radius: 6px; padding: 8px 12px; margin: 0; }
	legend { font-size: 0.8rem; color: #888; padding: 0 4px; }
	.radio { flex-direction: row; align-items: center; gap: 6px; font-size: 0.88rem; color: #bbb; }
	.radio input { accent-color: #fff; }
	button[type="submit"] {
		background: #fff;
		color: #0f0f0f;
		border: none;
		border-radius: 6px;
		padding: 9px;
		font-weight: 600;
		font-size: 0.9rem;
		cursor: pointer;
		transition: opacity 0.15s;
	}
	button:hover:not(:disabled) { opacity: 0.88; }
	button:disabled { opacity: 0.4; cursor: not-allowed; }
	.notice { font-size: 0.82rem; color: #e0a020; background: #1a1400; border: 1px solid #332800; border-radius: 6px; padding: 8px 10px; margin: 0; }
	.error { font-size: 0.82rem; color: #f06060; background: #1a0000; border: 1px solid #330000; border-radius: 6px; padding: 8px 10px; margin: 0; }
	.success { font-size: 0.82rem; color: #60c060; background: #001a00; border: 1px solid #003300; border-radius: 6px; padding: 8px 10px; margin: 0; }

	/* Recent matches */
	.match-feed { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
	.match-item {
		border: 1px solid #1e1e1e;
		border-radius: 8px;
		padding: 8px 10px;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.match-item.pending { border-color: #332800; background: #0e0a00; }
	.match-link {
		display: flex;
		justify-content: space-between;
		align-items: center;
		text-decoration: none;
		gap: 8px;
	}
	.match-link:hover .summary { color: #fff; }
	.summary { font-size: 0.85rem; color: #ccc; }
	.elo-shift { font-size: 0.78rem; color: #666; white-space: nowrap; }
	.pending-badge {
		font-size: 0.72rem;
		color: #e0a020;
		background: #1a1000;
		border: 1px solid #332000;
		border-radius: 4px;
		padding: 2px 6px;
		align-self: flex-start;
	}
</style>
