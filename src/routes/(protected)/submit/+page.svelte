<script>
import { enhance } from "$app/forms";
import { withActionToast } from "$lib/action-toast.js";

const { data, form } = $props();

let whiteId = $state("");
let blackId = $state("");
let result = $state("white");
let notation = $state("");
let submitting = $state(false);
let copyMsg = $state("");
const sampleWhiteId = $derived(
	whiteId || data.allPlayers[0]?._id || "WHITE_PLAYER_ID",
);
const sampleBlackId = $derived(
	blackId || data.allPlayers[1]?._id || "BLACK_PLAYER_ID",
);
const sampleResult = $derived(result || "white");
const sampleNotation = $derived(
	notation.trim() || "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6",
);
const payloadPreview = $derived(`{
  "whitePlayerId": "${sampleWhiteId}",
  "blackPlayerId": "${sampleBlackId}",
  "result": "${sampleResult}",
  "notation": "${sampleNotation.replaceAll('"', '\\"')}"
}`);
const sampleCurl = $derived(
	`curl -X POST ${data.apiSubmitUrl} \\
  -H "Authorization: Bearer ${data.apiSubmitKey}" \\
  -H "Content-Type: application/json" \\
  -d '${payloadPreview}'`,
);

const copyCurl = async () => {
	try {
		await navigator.clipboard.writeText(sampleCurl);
		copyMsg = "Copied curl command";
		setTimeout(() => {
			copyMsg = "";
		}, 1800);
	} catch {
		copyMsg = "Copy failed";
	}
};
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
		<form
			method="POST"
			action="?/logMatch"
			use:enhance={() => {
				submitting = true;
				return async ({ result: actionResult, update }) => {
					if (actionResult.type === 'success') {
						whiteId = '';
						blackId = '';
						result = 'white';
						notation = '';
					}
					await withActionToast()({ result: actionResult, update });
					submitting = false;
				};
			}}
		>
			<label>
				Who played white?  ⚪️
				<select name="whiteId" bind:value={whiteId} required>
					<option value="">Select player…</option>
					{#each data.allPlayers as p}
						<option value={p._id}>{p.name} ({p.rating})</option>
					{/each}
				</select>
			</label>
			<label>
				Who played black? ⚫️
				<select name="blackId" bind:value={blackId} required>
					<option value="">Select player…</option>
					{#each data.allPlayers as p}
						<option value={p._id}>{p.name} ({p.rating})</option>
					{/each}
				</select>
			</label>
			<fieldset>
				<legend>Result 🏆</legend>
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

	<section class="http-submit">
		<h2>Submit via HTTP</h2>
		{#if data.apiSubmitEnabled}
			<p class="http-help">You can also log matches programatically from scripts, third-party services, smart chessboards or jank web-cam + raspberri pi setups</p>
			<details>
				<summary>API details</summary>
				<div class="http-body">
					<p><strong>Endpoint:</strong> <code>POST {data.apiSubmitUrl}</code></p>
					<p><strong>Header:</strong> <code>Authorization: Bearer {data.apiSubmitKey}</code></p>
					<p><strong>Body (all required):</strong></p>
					<pre>{`{
  "whitePlayerId": "PLAYER_ID",
  "blackPlayerId": "PLAYER_ID",
  "result": "white|black|draw",
  "notation": "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6"
}`}</pre>
					<p class="http-note">
						You can also send FEN, for example:
						<code>rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1</code>
					</p>
					<p class="http-note">
						Invalid player IDs return <code>404</code>. Invalid notation returns <code>400</code>.
					</p>
					<p><strong>Example:</strong></p>
					<pre>{sampleCurl}</pre>
					<div class="copy-row">
						<button type="button" class="copy-btn" onclick={copyCurl}>Copy curl</button>
						{#if copyMsg}
							<span class="copy-msg">{copyMsg}</span>
						{/if}
					</div>
				</div>
			</details>
		{:else}
			<p class="http-disabled">
				Ask your admin to enable HTTP submissions in the admin panel.
			</p>
		{/if}
	</section>
</div>

<style>
	.submit-page {
		max-width: 480px;
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
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
	.http-submit {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 12px;
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}
	h2 { margin: 0; font-size: 1rem; color: var(--color-heading); }
	.http-help, .http-disabled, .http-note {
		margin: 0;
		font-size: 0.82rem;
		color: var(--color-text-subtle);
	}
	details { border: 1px solid var(--color-border); border-radius: 8px; padding: 8px 10px; }
	summary { cursor: pointer; font-size: 0.85rem; color: var(--color-text); }
	.http-body { margin-top: 8px; display: flex; flex-direction: column; gap: 8px; }
	pre {
		margin: 0;
		background: var(--color-input-bg);
		border: 1px solid var(--color-border);
		border-radius: 6px;
		padding: 8px 10px;
		font-size: 0.78rem;
		overflow-x: auto;
	}
	.copy-row { display: flex; align-items: center; gap: 10px; }
	.copy-btn {
		background: var(--color-btn-primary-bg);
		color: var(--color-btn-primary-text);
		border: none;
		border-radius: 6px;
		padding: 6px 10px;
		font-size: 0.78rem;
		font-weight: 600;
		cursor: pointer;
	}
	.copy-btn:hover { opacity: 0.9; }
	.copy-msg { font-size: 0.78rem; color: var(--color-text-subtle); }

	@media (max-width: 640px) {
		.log-match,
		.http-submit {
			padding: 1rem;
		}

		pre {
			font-size: 0.72rem;
		}

		.http-body code {
			word-break: break-all;
		}

		.copy-row {
			flex-direction: column;
			align-items: stretch;
		}

		.copy-btn {
			width: 100%;
			padding: 10px;
		}
	}
</style>
