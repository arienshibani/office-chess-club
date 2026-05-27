<script>
	let { data } = $props();
	let { player, matches, rank } = $derived(data);

	let totalGames = $derived(player.stats.wins + player.stats.losses + player.stats.draws);
	let winRate = $derived(totalGames > 0 ? Math.round((player.stats.wins / totalGames) * 100) : 0);
</script>

<svelte:head><title>{player.name} — Office Chess Club</title></svelte:head>

<div class="profile">
	<div class="header-card">
		{#if player.avatarUrl}
			<img src={player.avatarUrl} alt={player.name} class="avatar" />
		{:else}
			<div class="avatar-placeholder">♟</div>
		{/if}
		<div class="info">
			<h1>{player.name}</h1>
			<div class="meta">
				<span class="rating">{player.rating}</span>
				<span class="rank">Rank #{rank}</span>
			</div>
		</div>
	</div>

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
								{#if m.opponentAvatar}
									<img src={m.opponentAvatar} alt="" class="av" />
								{/if}
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

<style>
	.profile { display: flex; flex-direction: column; gap: 1.5rem; }

	.header-card {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		background: #141414;
		border: 1px solid #222;
		border-radius: 14px;
		padding: 1.5rem;
	}
	.avatar { width: 72px; height: 72px; border-radius: 50%; }
	.avatar-placeholder {
		width: 72px;
		height: 72px;
		background: #1e1e1e;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 2rem;
	}
	h1 { margin: 0 0 6px; font-size: 1.4rem; }
	.meta { display: flex; gap: 1rem; align-items: center; }
	.rating { font-size: 1.4rem; font-weight: 700; color: #f0c040; }
	.rank { color: #888; font-size: 0.9rem; }

	.stats-grid {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}
	.stat-card {
		flex: 1;
		min-width: 80px;
		background: #141414;
		border: 1px solid #222;
		border-radius: 10px;
		padding: 1rem;
		text-align: center;
	}
	.stat-val { font-size: 1.5rem; font-weight: 700; }
	.stat-val.wins { color: #60c060; }
	.stat-val.losses { color: #e06060; }
	.stat-val.draws { color: #aaa; }
	.stat-label { font-size: 0.75rem; color: #666; margin-top: 2px; }

	h2 { margin: 0 0 0.75rem; font-size: 1rem; color: #aaa; }
	.match-table { width: 100%; border-collapse: collapse; }
	.match-table th {
		text-align: left;
		padding: 8px 10px;
		font-size: 0.75rem;
		color: #555;
		border-bottom: 1px solid #222;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.match-table td { padding: 8px 10px; font-size: 0.87rem; border-bottom: 1px solid #1a1a1a; }
	.match-table tr:hover td { background: #141414; }
	.match-table tr.pending td { opacity: 0.7; }

	.opp-link { display: flex; align-items: center; gap: 6px; text-decoration: none; color: inherit; }
	.opp-link:hover { color: #fff; }
	.av { width: 20px; height: 20px; border-radius: 50%; }

	.color-cell { color: #666; font-size: 0.82rem; }
	.elo-cell { font-weight: 600; }
	.elo-cell.pos { color: #60c060; }
	.elo-cell.neg { color: #e06060; }
	.date-cell { color: #555; font-size: 0.8rem; }

	.view-link { color: #555; text-decoration: none; font-size: 0.8rem; }
	.view-link:hover { color: #aaa; }
	.empty { color: #555; text-align: center; padding: 1.5rem; }

	.badge {
		display: inline-block;
		padding: 2px 7px;
		border-radius: 4px;
		font-size: 0.78rem;
		font-weight: 500;
	}
	.win-badge { background: #0a200a; color: #60c060; border: 1px solid #1a4a1a; }
	.loss-badge { background: #200a0a; color: #e06060; border: 1px solid #4a1a1a; }
	.draw-badge { background: #1a1a1a; color: #aaa; border: 1px solid #333; }
	.pending-badge { background: #1a1000; color: #e0a020; border: 1px solid #332000; }
</style>
