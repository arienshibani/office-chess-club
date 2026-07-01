<script>
	import { enhance } from '$app/forms';
	import { CalendarDays, ClipboardPlus, Clock3, Minus, Trophy } from '@lucide/svelte';
	import { withActionToast } from '$lib/client/action-toast.js';
	import PgnGamePreview from '$lib/components/matches/PgnGamePreview.svelte';
	import ResultBadge from '$lib/components/matches/ResultBadge.svelte';
	import PieceColor from '$lib/components/player/PieceColor.svelte';
	import PlayerCombobox from '$lib/components/player/PlayerCombobox.svelte';
	import { getTimeFormatLabel } from '$lib/chess/time-control.js';

	/**
	 * @type {{
	 *   draft: {
	 *     _id: string;
	 *     draftResult: 'white' | 'black' | 'draw';
	 *     notation: string | null;
	 *     timeFormat: string | null;
	 *     playedAt: string | Date;
	 *   };
	 *   players: { _id: string; name: string; rating: number }[];
	 *   honorSystemEnabled: boolean;
	 * }}
	 */
	let { draft, players, honorSystemEnabled } = $props();

	let whiteId = $state('');
	let blackId = $state('');
	let submitting = $state(false);

	const resultVariant = $derived(
		draft.draftResult === 'draw'
			? 'draw'
			: draft.draftResult === 'white'
				? 'win'
				: 'loss',
	);

	const resultLabel = $derived(
		draft.draftResult === 'draw'
			? 'Draw'
			: draft.draftResult === 'white'
				? 'White wins'
				: 'Black wins',
	);

	const playedLabel = $derived(
		new Date(draft.playedAt).toLocaleString(undefined, {
			dateStyle: 'medium',
			timeStyle: 'short',
		}),
	);

	const canSubmit = $derived(!!whiteId && !!blackId && whiteId !== blackId);
</script>

<article class="draft-card">
	<header class="draft-header">
		<div class="badges">
			<ResultBadge variant={resultVariant} label={resultLabel} />
			{#if draft.timeFormat}
				<span class="meta with-icon">
					<Clock3 size={13} aria-hidden="true" />
					{getTimeFormatLabel(draft.timeFormat)}
				</span>
			{/if}
		</div>
		<span class="meta with-icon">
			<CalendarDays size={13} aria-hidden="true" />
			{playedLabel}
		</span>
	</header>

	<PgnGamePreview notation={draft.notation} />

	<form
		method="POST"
		action="?/finalizeDraft"
		class="assign-form"
		use:enhance={() => {
			submitting = true;
			return async ({ result, update }) => {
				await withActionToast()({ result, update });
				if (result.type === 'success') {
					whiteId = '';
					blackId = '';
				}
				submitting = false;
			};
		}}
	>
		<input type="hidden" name="draftId" value={draft._id} />

		<div class="player-row">
			<div class="player-field">
				<span class="color-label with-icon">
					<PieceColor color="white" size={12} />
					White
				</span>
				<PlayerCombobox
					{players}
					bind:value={whiteId}
					label="Who played white?"
					name="whiteId"
					excludeId={blackId}
				/>
			</div>
			<div class="player-field">
				<span class="color-label with-icon">
					<PieceColor color="black" size={12} />
					Black
				</span>
				<PlayerCombobox
					{players}
					bind:value={blackId}
					label="Who played black?"
					name="blackId"
					excludeId={whiteId}
				/>
			</div>
		</div>

		{#if !honorSystemEnabled}
			<p class="notice with-icon">
				<Trophy size={14} aria-hidden="true" />
				Honor system is off — finalized matches require admin approval.
			</p>
		{/if}

		<button type="submit" class="with-icon" disabled={submitting || !canSubmit}>
			<ClipboardPlus size={16} aria-hidden="true" />
			{submitting ? 'Saving…' : 'Log match'}
		</button>
	</form>
</article>

<style>
	.draft-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 12px;
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.draft-header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.badges {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
	}

	.meta {
		font-size: 0.78rem;
		color: var(--color-text-faint);
	}

	.assign-form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.player-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}

	.player-field {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.color-label {
		font-size: 0.82rem;
		color: var(--color-text-subtle);
		font-weight: 600;
	}

	.notice {
		font-size: 0.82rem;
		color: var(--color-warning);
		background: var(--color-notice-bg);
		border: 1px solid var(--color-notice-border);
		border-radius: 6px;
		padding: 8px 10px;
		margin: 0;
		align-items: flex-start;
	}

	button[type='submit'] {
		background: var(--color-btn-primary-bg);
		color: var(--color-btn-primary-text);
		border: none;
		border-radius: 6px;
		padding: 9px;
		font-weight: 600;
		font-size: 0.9rem;
		cursor: pointer;
		transition: opacity 0.15s;
		justify-content: center;
	}

	button:hover:not(:disabled) {
		opacity: 0.88;
	}

	button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	@media (max-width: 640px) {
		.player-row {
			grid-template-columns: 1fr;
		}
	}
</style>
