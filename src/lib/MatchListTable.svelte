<script>
	import { matchSummary, eloDisplay, formatMatchTimestamp } from '$lib/matches.js';

	let { matches = [] } = $props();
</script>

<table class="matches-table">
	<thead>
		<tr>
			<th>Match</th>
			<th>Elo</th>
			<th>When</th>
		</tr>
	</thead>
	<tbody>
		{#each matches as match}
			<tr class:pending={match.status === 'pending'}>
				<td>
					<a href="/matches/{match._id}" class="match-link">{matchSummary(match)}</a>
					{#if match.status === 'pending'}
						<span class="badge pending-badge">⚠ Pending</span>
					{/if}
				</td>
				<td class="elo-shift">{eloDisplay(match)}</td>
				<td class="timestamp">{formatMatchTimestamp(match.playedAt)}</td>
			</tr>
		{:else}
			<tr><td colspan="3" class="empty">No matches yet.</td></tr>
		{/each}
	</tbody>
</table>

<style>
	.matches-table { width: 100%; border-collapse: collapse; }
	.matches-table th {
		text-align: left;
		padding: 8px 10px;
		font-size: 0.78rem;
		color: var(--color-text-faint);
		border-bottom: 1px solid var(--color-border);
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.matches-table td {
		padding: 9px 10px;
		border-bottom: 1px solid var(--color-border-row);
		font-size: 0.9rem;
	}
	.matches-table tbody tr:hover td { background: var(--color-surface-hover); }
	.matches-table tr.pending td { opacity: 0.85; }
	.match-link {
		text-decoration: none;
		color: inherit;
	}
	.match-link:hover { color: var(--color-link-hover); }
	.elo-shift { color: var(--color-text-faint); white-space: nowrap; font-size: 0.85rem; }
	.timestamp { color: var(--color-text-dim); font-size: 0.8rem; white-space: nowrap; }
	.empty { color: var(--color-text-dim); padding: 1rem; text-align: center; }
	.pending-badge {
		margin-left: 8px;
		font-size: 0.72rem;
		color: var(--color-warning);
		background: var(--color-badge-pending-bg);
		border: 1px solid var(--color-badge-pending-border);
		border-radius: 4px;
		padding: 2px 6px;
		vertical-align: middle;
	}
</style>
