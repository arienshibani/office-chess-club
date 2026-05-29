<script>
	import { page } from '$app/stores';
	import MatchActionsMenu from '$lib/MatchActionsMenu.svelte';
	import MatchSummary from '$lib/MatchSummary.svelte';
	import ResultBadge from '$lib/ResultBadge.svelte';
	import { eloDisplay, formatMatchTimestamp } from '$lib/matches.js';

	let { matches = [], isAdmin = false } = $props();

	/** @param {{ isDraw: boolean, winnerId: string | null, whitePlayerId: string }} match */
	const currentResult = (match) =>
		match.isDraw ? 'draw' : match.winnerId === match.whitePlayerId ? 'white' : 'black';
</script>

<div class="table-wrap">
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
					<td data-label="Match">
						<a href="/matches/{match._id}" class="match-link"><MatchSummary {match} /></a>
						{#if match.status === 'pending'}
							<div class="pending-wrap">
								<ResultBadge variant="pending" />
							</div>
						{/if}
					</td>
					<td class="elo-shift" data-label="Elo">{eloDisplay(match)}</td>
					<td class="timestamp" data-label="When">{formatMatchTimestamp(match.playedAt)}</td>
					{#if isAdmin}
						<td class="actions-col" data-label="">
							<MatchActionsMenu
								matchId={match._id}
								status={match.status}
								result={currentResult(match)}
								whiteName={match.whiteName}
								blackName={match.blackName}
								returnTo="{$page.url.pathname}{$page.url.search}"
							/>
						</td>
					{/if}
				</tr>
			{:else}
				<tr><td colspan={isAdmin ? 4 : 3} class="empty">No matches yet.</td></tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.table-wrap {
		width: 100%;
		overflow: visible;
	}

	.matches-table {
		width: 100%;
		border-collapse: collapse;
	}

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

	.matches-table tbody tr:hover td {
		background: var(--color-surface-hover);
	}

	.matches-table tr.pending td {
		opacity: 0.85;
	}

	.match-link {
		text-decoration: none;
		color: inherit;
	}

	.match-link:hover {
		color: var(--color-link-hover);
	}

	.elo-shift {
		color: var(--color-text-faint);
		white-space: nowrap;
		font-size: 0.85rem;
	}

	.timestamp {
		color: var(--color-text-dim);
		font-size: 0.8rem;
		white-space: nowrap;
	}

	.empty {
		color: var(--color-text-dim);
		padding: 1rem;
		text-align: center;
	}

	.actions-col {
		width: 1%;
		white-space: nowrap;
		text-align: right;
		position: relative;
		overflow: visible;
	}

	.pending-wrap {
		display: inline-flex;
		margin-top: 4px;
	}

	@media (max-width: 640px) {
		.matches-table thead {
			display: none;
		}

		.matches-table tbody tr {
			display: block;
			background: var(--color-surface);
			border: 1px solid var(--color-border);
			border-radius: 10px;
			margin-bottom: 10px;
			padding: 4px 0;
		}

		.matches-table tbody tr:hover td {
			background: transparent;
		}

		.matches-table td {
			display: flex;
			align-items: flex-start;
			justify-content: space-between;
			gap: 12px;
			border: none;
			padding: 8px 12px;
		}

		.matches-table td::before {
			content: attr(data-label);
			flex-shrink: 0;
			font-size: 0.72rem;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.04em;
			color: var(--color-text-faint);
			padding-top: 2px;
		}

		.matches-table td:not([data-label])::before,
		.matches-table td[data-label='']::before {
			display: none;
		}

		.matches-table td.empty {
			display: block;
			text-align: center;
		}

		.matches-table td.empty::before {
			display: none;
		}

		.actions-col {
			justify-content: flex-end;
		}

		.pending-wrap {
			margin-left: 0;
		}
	}
</style>
