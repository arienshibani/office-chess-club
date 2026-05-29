<script>
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { matchSummary, eloDisplay, formatMatchTimestamp } from '$lib/matches.js';

	let { matches = [], isAdmin = false } = $props();
	let deletingId = $state(/** @type {string | null} */ (null));

	/** @param {string} matchId @param {boolean} wasApproved */
	const confirmDelete = (matchId, wasApproved) => {
		const message = wasApproved
			? 'Delete this match and revert both players’ ratings and stats?'
			: 'Delete this pending match?';
		return confirm(message);
	};
</script>

<table class="matches-table">
	<thead>
		<tr>
			<th>Match</th>
			<th>Elo</th>
			<th>When</th>
			{#if isAdmin}
				<th class="actions-col"></th>
			{/if}
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
				{#if isAdmin}
					<td class="actions-col">
						<form
							method="POST"
							action="/matches?/deleteMatch"
							use:enhance={() => {
								deletingId = match._id;
								return async ({ update }) => {
									await update();
									deletingId = null;
								};
							}}
							onsubmit={(event) => {
								if (!confirmDelete(match._id, match.status === 'approved')) {
									event.preventDefault();
								}
							}}
						>
							<input type="hidden" name="matchId" value={match._id} />
							<input type="hidden" name="returnTo" value="{$page.url.pathname}{$page.url.search}" />
							<button
								type="submit"
								class="delete-btn"
								disabled={deletingId === match._id}
								title="Delete match"
							>
								{deletingId === match._id ? '…' : 'Delete'}
							</button>
						</form>
					</td>
				{/if}
			</tr>
		{:else}
			<tr><td colspan={isAdmin ? 4 : 3} class="empty">No matches yet.</td></tr>
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
	.actions-col { width: 1%; white-space: nowrap; text-align: right; }
	.delete-btn {
		background: transparent;
		border: 1px solid var(--color-admin-reject-border);
		color: var(--color-error);
		border-radius: 5px;
		padding: 4px 8px;
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
	}
	.delete-btn:hover:not(:disabled) { background: var(--color-admin-reject-bg); }
	.delete-btn:disabled { opacity: 0.5; cursor: not-allowed; }
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
