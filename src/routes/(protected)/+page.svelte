<script>
import { ArrowRight } from "@lucide/svelte";
import MatchListTable from "$lib/MatchListTable.svelte";
import PlayerAvatar from "$lib/PlayerAvatar.svelte";

const { data } = $props();

const githubRepoUrl = "https://github.com/arienshibani/office-chess-club";

/** @param {number} r */
const ratingColor = (r) => {
	if (r >= 1400) return "#f0c040";
	if (r >= 1300) return "#a0c8ff";
	return "#aaa";
};
</script>

<svelte:head><title>Home — Office Chess Club</title></svelte:head>

<div class="dashboard">
	<div class="dashboard-content">
	<section class="leaderboard-section">
		<h2>Leaderboard</h2>
		<div class="table-scroll">
		<table class="leaderboard">
			<thead>
				<tr>
					<th class="rank">#</th>
					<th>Player</th>
					<th>Rating</th>
					<th class="col-stats">W</th>
					<th class="col-stats">L</th>
					<th class="col-stats">D</th>
					<th class="col-stats">Games</th>
				</tr>
			</thead>
			<tbody>
				{#each data.leaderboard as player, i}
					{@const games = player.stats.wins + player.stats.losses + player.stats.draws}
					<tr>
						<td class="rank">{i + 1}</td>
						<td>
							<a href="/players/{player._id}" class="player-link">
								<PlayerAvatar
									icon={player.icon}
									avatarUrl={player.avatarUrl}
									size={24}
								/>
								{player.name}
							</a>
						</td>
						<td class="rating" style="color: {ratingColor(player.rating)}">{player.rating}</td>
						<td class="stat col-stats">{player.stats.wins}</td>
						<td class="stat col-stats">{player.stats.losses}</td>
						<td class="stat col-stats">{player.stats.draws}</td>
						<td class="stat muted col-stats">{games}</td>
					</tr>
				{:else}
					<tr><td colspan="7" class="empty">No players yet.</td></tr>
				{/each}
			</tbody>
		</table>
		</div>
	</section>

	<section class="recent-matches">
		<h2>Recent Matches</h2>
		<MatchListTable matches={data.recentMatches} isAdmin={!!data.user?.isAdmin} />
		{#if data.recentMatches.length > 0}
			<a href="/matches" class="view-all with-icon">
				View all matches
				<ArrowRight size={15} aria-hidden="true" />
			</a>
		{/if}
	</section>
	</div>

	<footer class="repo-footer">
		<a href={githubRepoUrl} target="_blank" rel="noopener noreferrer">View on GitHub</a>
	</footer>
</div>

<style>
	.dashboard {
		display: flex;
		flex-direction: column;
		min-height: calc(100vh - 56px - 4rem);
		gap: 2rem;
	}

	.dashboard-content {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		flex: 1;
	}

	.repo-footer {
		margin-top: auto;
		padding-top: 1rem;
		text-align: center;
	}

	.repo-footer a {
		font-size: 0.75rem;
		color: var(--color-text-extra-dim);
		text-decoration: none;
		transition: color 0.15s;
	}

	.repo-footer a:hover {
		color: var(--color-text-dim);
	}
	h2 { margin: 0 0 1rem; font-size: 1.1rem; font-weight: 600; color: var(--color-heading); }

	.leaderboard { width: 100%; border-collapse: collapse; }
	.leaderboard th {
		text-align: left;
		padding: 8px 10px;
		font-size: 0.78rem;
		color: var(--color-text-faint);
		border-bottom: 1px solid var(--color-border);
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.leaderboard td {
		padding: 9px 10px;
		border-bottom: 1px solid var(--color-border-row);
		font-size: 0.9rem;
	}
	.leaderboard tbody tr:hover td { background: var(--color-surface-hover); }
	.leaderboard th.rank,
	.rank { color: var(--color-text-dim); font-size: 0.8rem; width: 30px; text-align: center; }
	.rating { font-weight: 700; font-size: 1rem; }
	.leaderboard th.col-stats,
	.leaderboard td.col-stats {
		text-align: center;
		width: 3.25rem;
		padding-left: 14px;
		padding-right: 14px;
		font-variant-numeric: tabular-nums;
	}
	.leaderboard th.col-stats:last-child,
	.leaderboard td.col-stats:last-child {
		width: 4.75rem;
		padding-left: 45px;
	}
	.stat { color: var(--color-text-muted); }
	.muted { color: var(--color-text-dim); }
	.player-link {
		display: flex;
		align-items: center;
		gap: 8px;
		text-decoration: none;
		color: inherit;
	}
	.player-link:hover { color: var(--color-link-hover); }
	.empty { color: var(--color-text-dim); padding: 1rem; text-align: center; }

	.recent-matches { display: flex; flex-direction: column; gap: 0.75rem; }
	.view-all {
		align-self: flex-start;
		font-size: 0.85rem;
		color: var(--color-text-subtle);
		text-decoration: none;
	}
	.view-all:hover { color: var(--color-link-hover); }

	@media (max-width: 640px) {
		.leaderboard th.col-stats,
		.leaderboard td.col-stats {
			display: none;
		}

		.leaderboard {
			min-width: 0;
		}

		.table-scroll > table.leaderboard {
			min-width: 280px;
		}

		.player-link {
			font-size: 0.85rem;
		}

		.rating {
			font-size: 0.95rem;
		}
	}
</style>
