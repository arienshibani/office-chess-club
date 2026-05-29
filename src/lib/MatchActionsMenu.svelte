<script>
	import { browser } from '$app/environment';
	import { enhance } from '$app/forms';
	import { Check, EllipsisVertical, PencilLine, Trash2, X } from '@lucide/svelte';
	import { withActionToast } from '$lib/action-toast.js';

	let {
		matchId,
		status,
		result,
		whiteName,
		blackName,
		returnTo = '',
		deleteAction = '/matches?/deleteMatch',
		correctAction = '/matches?/correctResult'
	} = $props();

	let menuOpen = $state(false);
	let modalOpen = $state(false);
	let busy = $state(false);
	/** @type {'white' | 'black' | 'draw'} */
	let selectedResult = $state('white');
	/** @type {HTMLDivElement | null} */
	let wrapperEl = $state(null);

	const toggleMenu = () => {
		menuOpen = !menuOpen;
	};

	const closeMenu = () => {
		menuOpen = false;
	};

	const openCorrectModal = () => {
		selectedResult = result;
		closeMenu();
		modalOpen = true;
	};

	const closeModal = () => {
		modalOpen = false;
	};

	/** @param {boolean} wasApproved */
	const confirmDelete = (wasApproved) => {
		const message = wasApproved
			? 'Delete this match and revert both players’ ratings and stats?'
			: 'Delete this pending match?';
		return confirm(message);
	};

	/** @type {Array<{ value: 'white' | 'black' | 'draw', label: string }>} */
	const resultOptions = $derived([
		{ value: 'white', label: `White wins (${whiteName})` },
		{ value: 'black', label: `Black wins (${blackName})` },
		{ value: 'draw', label: 'Draw' }
	]);

	const canSave = $derived(selectedResult !== result);

	$effect(() => {
		if (!browser || !menuOpen) return;
		/** @param {MouseEvent} e */
		const onDocClick = (e) => {
			if (wrapperEl && !wrapperEl.contains(/** @type {Node} */ (e.target))) {
				closeMenu();
			}
		};
		document.addEventListener('click', onDocClick);
		return () => document.removeEventListener('click', onDocClick);
	});

	$effect(() => {
		if (!browser || (!menuOpen && !modalOpen)) return;
		/** @param {KeyboardEvent} e */
		const onKeyDown = (e) => {
			if (e.key === 'Escape') {
				if (modalOpen) closeModal();
				else closeMenu();
			}
		};
		document.addEventListener('keydown', onKeyDown);
		return () => document.removeEventListener('keydown', onKeyDown);
	});

	$effect(() => {
		if (!browser || !modalOpen) return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = prev;
		};
	});
</script>

<div class="match-actions" bind:this={wrapperEl}>
	<button
		type="button"
		class="actions-trigger"
		onclick={toggleMenu}
		aria-label="Match actions"
		aria-haspopup="menu"
		aria-expanded={menuOpen}
		disabled={busy}
	>
		<EllipsisVertical size={16} aria-hidden="true" />
	</button>

	{#if menuOpen}
		<div class="menu" role="menu">
			<button type="button" class="menu-item with-icon" role="menuitem" onclick={openCorrectModal}>
				<PencilLine size={15} aria-hidden="true" />
				Correct result
			</button>

			<div class="menu-divider"></div>

			<form
				method="POST"
				action={deleteAction}
				use:enhance={() => {
					busy = true;
					closeMenu();
					return async (ctx) => {
						await withActionToast({ redirectMessage: 'Match deleted.' })(ctx);
						busy = false;
					};
				}}
				onsubmit={(event) => {
					if (!confirmDelete(status === 'approved')) {
						event.preventDefault();
					}
				}}
			>
				<input type="hidden" name="matchId" value={matchId} />
				{#if returnTo}
					<input type="hidden" name="returnTo" value={returnTo} />
				{/if}
				<button type="submit" class="menu-item danger with-icon" disabled={busy} role="menuitem">
					<Trash2 size={15} aria-hidden="true" />
					Delete match
				</button>
			</form>
		</div>
	{/if}
</div>

{#if modalOpen}
	<div class="modal-backdrop" onclick={closeModal} aria-hidden="true"></div>
	<div class="modal" role="dialog" aria-modal="true" aria-labelledby="correct-result-title">
		<div class="modal-header">
			<h2 id="correct-result-title">Correct result</h2>
			<button type="button" class="modal-close" onclick={closeModal} aria-label="Close">
				<X size={18} aria-hidden="true" />
			</button>
		</div>

		<p class="modal-hint">
			{#if status === 'approved'}
				Choose the correct outcome. Both players’ ratings and stats will be updated.
			{:else}
				Choose the correct outcome for this pending match.
			{/if}
		</p>

		<form
			method="POST"
			action={correctAction}
			use:enhance={() => {
				busy = true;
				return async (ctx) => {
					await withActionToast({
						redirectMessage: returnTo ? 'Match result updated.' : undefined
					})(ctx);
					busy = false;
					closeModal();
				};
			}}
		>
			<input type="hidden" name="matchId" value={matchId} />
			<input type="hidden" name="result" value={selectedResult} />
			{#if returnTo}
				<input type="hidden" name="returnTo" value={returnTo} />
			{/if}

			<fieldset class="result-options">
				<legend class="sr-only">Match result</legend>
				{#each resultOptions as option}
					<label class="result-option" class:current={option.value === result}>
						<input
							type="radio"
							name="resultChoice"
							value={option.value}
							bind:group={selectedResult}
						/>
						<span class="result-label">{option.label}</span>
						{#if option.value === result}
							<span class="current-mark">Current</span>
						{/if}
					</label>
				{/each}
			</fieldset>

			<div class="modal-actions">
				<button type="button" class="btn secondary" onclick={closeModal} disabled={busy}>
					Cancel
				</button>
				<button type="submit" class="btn primary with-icon" disabled={busy || !canSave}>
					<Check size={15} aria-hidden="true" />
					{busy ? 'Saving…' : 'Save correction'}
				</button>
			</div>
		</form>
	</div>
{/if}

<style>
	.match-actions {
		position: relative;
		display: inline-flex;
	}

	.actions-trigger {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		padding: 0;
		border: 1px solid var(--color-border-nav);
		border-radius: 6px;
		background: transparent;
		color: var(--color-text-muted);
		cursor: pointer;
		transition: background 0.15s, color 0.15s, border-color 0.15s;
	}

	.actions-trigger:hover:not(:disabled) {
		background: var(--color-surface-hover);
		color: var(--color-text);
		border-color: var(--color-border-strong);
	}

	.actions-trigger:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.menu {
		position: absolute;
		top: calc(100% + 6px);
		right: 0;
		z-index: 50;
		min-width: 180px;
		padding: 6px;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 10px;
		box-shadow: 0 8px 24px rgb(0 0 0 / 12%);
	}

	.menu-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		width: 100%;
		padding: 8px 10px;
		border: none;
		border-radius: 6px;
		background: transparent;
		color: var(--color-text);
		font-size: 0.82rem;
		text-align: left;
		cursor: pointer;
		transition: background 0.15s;
	}

	.menu-item:hover:not(:disabled) {
		background: var(--color-surface-hover);
	}

	.menu-item:disabled {
		opacity: 0.55;
		cursor: default;
	}

	.menu-item.danger {
		color: var(--color-error);
	}

	.menu-item.danger:hover:not(:disabled) {
		background: var(--color-admin-reject-bg);
	}

	.menu-divider {
		height: 1px;
		margin: 6px 4px;
		background: var(--color-border);
	}

	.modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 200;
		background: rgb(0 0 0 / 45%);
	}

	.modal {
		position: fixed;
		top: 50%;
		left: 50%;
		z-index: 201;
		transform: translate(-50%, -50%);
		width: min(420px, calc(100vw - 2rem));
		padding: 1.25rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 12px;
		box-shadow: 0 16px 48px rgb(0 0 0 / 18%);
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 0.5rem;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-heading);
	}

	.modal-close {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		padding: 0;
		border: none;
		border-radius: 6px;
		background: transparent;
		color: var(--color-text-muted);
		font-size: 1.25rem;
		line-height: 1;
		cursor: pointer;
	}

	.modal-close:hover {
		background: var(--color-surface-hover);
		color: var(--color-text);
	}

	.modal-hint {
		margin: 0 0 1rem;
		font-size: 0.82rem;
		color: var(--color-text-faint);
		line-height: 1.45;
	}

	.result-options {
		margin: 0;
		padding: 0;
		border: none;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.result-option {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 12px;
		border: 1px solid var(--color-border);
		border-radius: 8px;
		cursor: pointer;
		transition: border-color 0.15s, background 0.15s;
	}

	.result-option:hover {
		background: var(--color-surface-hover);
	}

	.result-option.current {
		border-color: var(--color-border-strong);
	}

	.result-option input {
		flex-shrink: 0;
	}

	.result-label {
		flex: 1;
		font-size: 0.88rem;
		color: var(--color-text);
	}

	.current-mark {
		font-size: 0.68rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-faint);
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 1.25rem;
	}

	.btn {
		padding: 8px 14px;
		border-radius: 6px;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		border: 1px solid transparent;
	}

	.btn:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	.btn.secondary {
		background: transparent;
		border-color: var(--color-border-strong);
		color: var(--color-text-muted);
	}

	.btn.secondary:hover:not(:disabled) {
		background: var(--color-surface-hover);
		color: var(--color-text);
	}

	.btn.primary {
		background: var(--color-btn-primary-bg);
		color: var(--color-btn-primary-text);
	}

	.btn.primary:hover:not(:disabled) {
		opacity: 0.92;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
