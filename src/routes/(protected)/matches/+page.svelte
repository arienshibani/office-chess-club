<script>
	import MatchListTable from '$lib/MatchListTable.svelte';

	let { data } = $props();
	let { matches, pagination } = $derived(data);

	/** @param {number} page */
	const pageHref = (page) => (page === 1 ? '/matches' : `/matches?page=${page}`);
</script>

<svelte:head><title>Match History — Office Chess Club</title></svelte:head>

<div class="matches-page">
	<div class="page-header">
		<h1>Match History</h1>
		{#if pagination.total > 0}
			<p class="subtitle">{pagination.total} match{pagination.total === 1 ? '' : 'es'} total</p>
		{/if}
	</div>

	<MatchListTable {matches} />

	{#if pagination.totalPages > 1}
		<nav class="pagination" aria-label="Match pages">
			{#if pagination.hasPrev}
				<a href={pageHref(pagination.page - 1)} class="page-nav">← Previous</a>
			{:else}
				<span class="page-nav disabled">← Previous</span>
			{/if}

			<div class="page-numbers">
				{#each Array.from({ length: pagination.totalPages }, (_, i) => i + 1) as pageNum}
					<a
						href={pageHref(pageNum)}
						class="page-num"
						class:active={pageNum === pagination.page}
						aria-current={pageNum === pagination.page ? 'page' : undefined}
					>{pageNum}</a>
				{/each}
			</div>

			{#if pagination.hasNext}
				<a href={pageHref(pagination.page + 1)} class="page-nav">Next →</a>
			{:else}
				<span class="page-nav disabled">Next →</span>
			{/if}
		</nav>
	{/if}
</div>

<style>
	.matches-page { display: flex; flex-direction: column; gap: 1.25rem; }
	.page-header { display: flex; flex-direction: column; gap: 0.35rem; }
	h1 { margin: 0; font-size: 1.2rem; font-weight: 600; color: var(--color-heading); }
	.subtitle { margin: 0; font-size: 0.85rem; color: var(--color-text-faint); }

	.pagination {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		flex-wrap: wrap;
		padding-top: 0.5rem;
	}
	.page-nav {
		font-size: 0.85rem;
		color: var(--color-text-muted);
		text-decoration: none;
		padding: 6px 10px;
		border: 1px solid var(--color-border-strong);
		border-radius: 6px;
		background: var(--color-surface);
	}
	.page-nav:hover:not(.disabled) { color: var(--color-link-hover); border-color: var(--color-border-focus); }
	.page-nav.disabled {
		opacity: 0.35;
		cursor: default;
	}
	.page-numbers {
		display: flex;
		gap: 0.35rem;
		flex-wrap: wrap;
		justify-content: center;
	}
	.page-num {
		min-width: 2rem;
		text-align: center;
		font-size: 0.85rem;
		color: var(--color-text-subtle);
		text-decoration: none;
		padding: 6px 8px;
		border-radius: 6px;
		border: 1px solid transparent;
	}
	.page-num:hover { color: var(--color-link-hover); background: var(--color-surface-raised); }
	.page-num.active {
		color: var(--color-link-hover);
		background: var(--color-pagination-active-bg);
		border-color: var(--color-pagination-active-border);
		font-weight: 600;
	}
</style>
