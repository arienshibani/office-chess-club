<script>
	import { ChevronDown, Search } from '@lucide/svelte';

	/** @type {{ players: { _id: string; name: string; rating: number }[]; value?: string; label: string; excludeId?: string; name?: string; disabled?: boolean }} */
	let {
		players,
		value = $bindable(''),
		label,
		excludeId = '',
		name = '',
		disabled = false,
	} = $props();

	let open = $state(false);
	let query = $state('');
	let activeIndex = $state(0);
	let rootEl = $state(/** @type {HTMLDivElement | null} */ (null));
	let inputEl = $state(/** @type {HTMLInputElement | null} */ (null));

	const selected = $derived(players.find((p) => p._id === value) ?? null);

	const filtered = $derived(
		players
			.filter((p) => p._id !== excludeId)
			.filter((p) => {
				const q = query.trim().toLowerCase();
				if (!q) return true;
				return p.name.toLowerCase().includes(q);
			}),
	);

	const displayLabel = $derived(
		selected ? `${selected.name} (${selected.rating})` : 'Select player…',
	);

	const listboxId = $derived(`player-combobox-${name || label}`.replace(/\s+/g, '-').toLowerCase());

	const selectPlayer = (/** @type {string} */ playerId) => {
		value = playerId;
		open = false;
		query = '';
		activeIndex = 0;
	};

	const openList = () => {
		if (disabled) return;
		open = true;
		query = '';
		activeIndex = 0;
		requestAnimationFrame(() => inputEl?.focus());
	};

	const closeList = () => {
		open = false;
		query = '';
		activeIndex = 0;
	};

	const onInputKeydown = (/** @type {KeyboardEvent} */ event) => {
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			activeIndex = Math.min(activeIndex + 1, Math.max(filtered.length - 1, 0));
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			activeIndex = Math.max(activeIndex - 1, 0);
		} else if (event.key === 'Enter') {
			event.preventDefault();
			const pick = filtered[activeIndex];
			if (pick) selectPlayer(pick._id);
		} else if (event.key === 'Escape') {
			event.preventDefault();
			closeList();
		}
	};

	$effect(() => {
		if (!open) return;
		const onDocClick = (/** @type {MouseEvent} */ event) => {
			if (rootEl && !rootEl.contains(/** @type {Node} */ (event.target))) {
				closeList();
			}
		};
		document.addEventListener('mousedown', onDocClick);
		return () => document.removeEventListener('mousedown', onDocClick);
	});

	$effect(() => {
		if (activeIndex >= filtered.length) activeIndex = Math.max(filtered.length - 1, 0);
	});
</script>

<div class="combobox" bind:this={rootEl}>
	<span class="field-label">{label}</span>
	<div class="combobox-control" class:open class:disabled>
		<button
			type="button"
			class="combobox-trigger"
			role="combobox"
			aria-expanded={open}
			aria-controls={listboxId}
			aria-haspopup="listbox"
			{disabled}
			onclick={() => (open ? closeList() : openList())}
		>
			<span class:placeholder={!selected}>{displayLabel}</span>
			<ChevronDown size={16} aria-hidden="true" />
		</button>
		{#if open}
			<div class="combobox-popover">
				<div class="search-row">
					<Search size={14} aria-hidden="true" />
					<input
						bind:this={inputEl}
						type="search"
						placeholder="Search players…"
						bind:value={query}
						onkeydown={onInputKeydown}
						aria-label="Search players"
					/>
				</div>
				<div id={listboxId} role="listbox" class="options">
					{#if filtered.length === 0}
						<p class="empty" role="presentation">No players found</p>
					{:else}
						{#each filtered as player, index (player._id)}
							<button
								type="button"
								role="option"
								aria-selected={value === player._id}
								class="option"
								class:active={index === activeIndex}
								class:selected={value === player._id}
								onmousedown={(event) => event.preventDefault()}
								onclick={() => selectPlayer(player._id)}
							>
								<span class="name">{player.name}</span>
								<span class="rating">{player.rating}</span>
							</button>
						{/each}
					{/if}
				</div>
			</div>
		{/if}
	</div>
	{#if name}
		<input type="hidden" {name} {value} />
	{/if}
</div>

<style>
	.combobox {
		display: flex;
		flex-direction: column;
		gap: 4px;
		position: relative;
	}

	.field-label {
		font-size: 0.82rem;
		color: var(--color-text-subtle);
	}

	.combobox-control {
		position: relative;
	}

	.combobox-trigger {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		background: var(--color-input-bg);
		border: 1px solid var(--color-border-strong);
		border-radius: 6px;
		color: var(--color-text);
		padding: 8px 10px;
		font-size: 0.9rem;
		font-family: inherit;
		cursor: pointer;
		text-align: left;
	}

	.combobox-control.open .combobox-trigger {
		border-color: var(--color-border-focus);
		outline: 1px solid var(--color-border-focus);
	}

	.combobox-control.disabled .combobox-trigger {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.placeholder {
		color: var(--color-text-faint);
	}

	.combobox-popover {
		position: absolute;
		top: calc(100% + 4px);
		left: 0;
		right: 0;
		z-index: 20;
		background: var(--color-surface);
		border: 1px solid var(--color-border-strong);
		border-radius: 8px;
		box-shadow: 0 8px 24px rgb(0 0 0 / 0.18);
		overflow: hidden;
	}

	.search-row {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 10px;
		border-bottom: 1px solid var(--color-border);
		color: var(--color-text-faint);
	}

	.search-row input {
		flex: 1;
		border: none;
		background: transparent;
		color: var(--color-text);
		font-size: 0.88rem;
		font-family: inherit;
		outline: none;
	}

	.options {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 4px;
		max-height: 220px;
		overflow-y: auto;
	}

	.option {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		width: 100%;
		padding: 8px 10px;
		border: none;
		border-radius: 6px;
		background: transparent;
		color: inherit;
		font: inherit;
		cursor: pointer;
		text-align: left;
	}

	.option.active,
	.option:hover {
		background: var(--color-surface-muted);
	}

	.option.selected .name {
		font-weight: 600;
	}

	.rating {
		font-size: 0.78rem;
		color: var(--color-text-faint);
	}

	.empty {
		color: var(--color-text-faint);
		cursor: default;
		justify-content: center;
	}
</style>
