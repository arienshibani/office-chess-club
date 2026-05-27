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
</script>

<svelte:head><title>Submit results — Office Chess Club</title></svelte:head>

<div class="submit-page">
	<h1>Submit results</h1>
	<p class="subtitle">Log a match result to update the leaderboard.</p>

	<section class="log-match">
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
</div>

<style>
	.submit-page { max-width: 480px; display: flex; flex-direction: column; gap: 1rem; }
	h1 { margin: 0; font-size: 1.2rem; font-weight: 600; color: var(--color-heading); }
	.subtitle { margin: 0; font-size: 0.9rem; color: var(--color-text-faint); }

	.log-match {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 12px;
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	form { display: flex; flex-direction: column; gap: 0.75rem; }
	label { display: flex; flex-direction: column; gap: 4px; font-size: 0.82rem; color: var(--color-text-subtle); }
	select, textarea {
		background: var(--color-input-bg);
		border: 1px solid var(--color-border-strong);
		border-radius: 6px;
		color: var(--color-text);
		padding: 8px 10px;
		font-size: 0.9rem;
		font-family: inherit;
	}
	select:focus, textarea:focus { outline: 1px solid var(--color-border-focus); }
	fieldset { border: 1px solid var(--color-border); border-radius: 6px; padding: 8px 12px; margin: 0; }
	legend { font-size: 0.8rem; color: var(--color-text-subtle); padding: 0 4px; }
	.radio { flex-direction: row; align-items: center; gap: 6px; font-size: 0.88rem; color: var(--color-radio-text); }
	.radio input { accent-color: var(--color-accent-input); }
	button[type="submit"] {
		background: var(--color-btn-primary-bg);
		color: var(--color-btn-primary-text);
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
	.notice { font-size: 0.82rem; color: var(--color-warning); background: var(--color-notice-bg); border: 1px solid var(--color-notice-border); border-radius: 6px; padding: 8px 10px; margin: 0; }
	.error { font-size: 0.82rem; color: var(--color-error); background: var(--color-error-bg); border: 1px solid var(--color-error-border); border-radius: 6px; padding: 8px 10px; margin: 0; }
	.success { font-size: 0.82rem; color: var(--color-success); background: var(--color-success-bg); border: 1px solid var(--color-success-border); border-radius: 6px; padding: 8px 10px; margin: 0; }
</style>
