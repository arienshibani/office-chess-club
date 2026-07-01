<script>
import { enhance } from "$app/forms";
import { goto } from "$app/navigation";
import { page } from "$app/stores";
import { AlertTriangle, ClipboardPlus, Copy, Minus, Radio, Trophy } from "@lucide/svelte";
import { withActionToast } from "$lib/client/action-toast.js";
import DraftMatchCard from "$lib/components/matches/DraftMatchCard.svelte";
import PieceColor from "$lib/components/player/PieceColor.svelte";

const { data, form } = $props();

let whiteId = $state("");
let blackId = $state("");
let result = $state("white");
let notation = $state("");
let timeFormat = $state("");
let submitting = $state(false);
let copyMsg = $state("");
let lastDefaultTimeFormat = $state('');

const activeTab = $derived(data.activeTab);

$effect(() => {
	if (!timeFormat || data.defaultTimeFormat !== lastDefaultTimeFormat) {
		timeFormat = data.defaultTimeFormat;
		lastDefaultTimeFormat = data.defaultTimeFormat;
	}
});

const setTab = (/** @type {'manual' | 'drafts'} */ tab) => {
	const next = new URL($page.url);
	if (tab === 'drafts') {
		next.searchParams.set('tab', 'drafts');
	} else {
		next.searchParams.delete('tab');
	}
	goto(`${next.pathname}${next.search}`, { replaceState: true, noScroll: true });
};

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
const sampleTimeFormat = $derived(timeFormat || data.defaultTimeFormat);
const payloadPreview = $derived(`{
  "whitePlayerId": "${sampleWhiteId}",
  "blackPlayerId": "${sampleBlackId}",
  "result": "${sampleResult}",
  "notation": "${sampleNotation.replaceAll('"', '\\"')}",
  "timeFormat": "${sampleTimeFormat}"
}`);
const sampleCurl = $derived(
	`curl -X POST ${data.apiSubmitUrl} \\
  -H "Authorization: Bearer ${data.apiSubmitKey}" \\
  -H "Content-Type: application/json" \\
  -d '${payloadPreview}'`,
);
const sampleDraftCurl = $derived(
	`curl -X POST ${data.apiDraftUrl} \\
  -H "Authorization: Bearer ${data.apiSubmitKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"result":"white","notation":"1. e4 e5","timeFormat":"600+0"}'`,
);

const copyCurl = async (/** @type {string} */ text) => {
	try {
		await navigator.clipboard.writeText(text);
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

<div class="submit-page" class:wide={activeTab === 'drafts'}>
	<h1>Submit results</h1>
	<p class="subtitle">Log a match result to update the leaderboard.</p>

	{#if !data.canSubmit}
		<section class="log-match blocked">
			<p class="notice with-icon">
				<AlertTriangle size={15} aria-hidden="true" />
				Your account is pending admin approval. You can browse matches and profiles, but you cannot submit
				results until an admin promotes you to member.
			</p>
		</section>
	{:else}
		{#if data.showDraftsTab}
			<div class="mode-tabs" role="tablist" aria-label="Submit mode">
				<button
					type="button"
					role="tab"
					class="with-icon"
					class:active={activeTab === 'manual'}
					aria-selected={activeTab === 'manual'}
					onclick={() => setTab('manual')}
				>
					<ClipboardPlus size={15} aria-hidden="true" />
					Log match
				</button>
				<button
					type="button"
					role="tab"
					class="with-icon"
					class:active={activeTab === 'drafts'}
					aria-selected={activeTab === 'drafts'}
					onclick={() => setTab('drafts')}
				>
					<Radio size={15} aria-hidden="true" />
					Board drafts
					{#if data.drafts.length > 0}
						<span class="tab-count">{data.drafts.length}</span>
					{/if}
				</button>
			</div>
		{/if}

		{#if activeTab === 'drafts' && data.showDraftsTab}
			<section class="drafts-panel">
				{#if !data.boardUploadsEnabled}
					<div class="empty-state">
						<h2>Board uploads not enabled</h2>
						<p>
							Automatic uploads from a DGT board require HTTP submissions. Ask an admin to
							generate an API key and enable HTTP submissions under
							<strong>Admin → Advanced → API Key</strong>.
						</p>
						<a class="guide-link" href="/guides/smart-board">How board uploads work →</a>
					</div>
				{:else if data.drafts.length === 0}
					<div class="empty-state">
						<h2>Waiting for board uploads</h2>
						<p>
							This club accepts games from a connected DGT board. When a game ends on the board,
							it will appear here for you to assign players and log the result.
						</p>
						<div class="endpoint-box">
							<p><strong>Upload endpoint:</strong></p>
							<code>POST {data.apiDraftUrl}</code>
						</div>
						<div class="how-it-works">
							<h3>How it works</h3>
							<ol>
								<li>Play on the physical board while a Raspberry Pi records the game.</li>
								<li>When the game ends, the Pi uploads the PGN automatically.</li>
								<li>Pick White and Black here, then log the match.</li>
							</ol>
						</div>
						<a class="guide-link" href="/guides/smart-board">Set up a DGT board →</a>
					</div>
				{:else}
					<div class="draft-list">
						{#each data.drafts as draft (draft._id)}
							<DraftMatchCard
								{draft}
								players={data.allPlayers}
								honorSystemEnabled={data.honorSystemEnabled}
							/>
						{/each}
					</div>
				{/if}
			</section>
		{:else}
			<section class="log-match">
				{#if !data.honorSystemEnabled}
					<p class="notice with-icon">
						<AlertTriangle size={15} aria-hidden="true" />
						Honor system is off — matches require admin approval.
					</p>
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
								timeFormat = data.defaultTimeFormat;
							}
							await withActionToast()({ result: actionResult, update });
							submitting = false;
						};
					}}
				>
					<label class="with-icon">
						<span class="label-row">
							<PieceColor color="white" size={12} />
							Who played white?
						</span>
						<select name="whiteId" bind:value={whiteId} required>
							<option value="">Select player…</option>
							{#each data.allPlayers as p}
								<option value={p._id}>{p.name} ({p.rating})</option>
							{/each}
						</select>
					</label>
					<label class="with-icon">
						<span class="label-row">
							<PieceColor color="black" size={12} />
							Who played black?
						</span>
						<select name="blackId" bind:value={blackId} required>
							<option value="">Select player…</option>
							{#each data.allPlayers as p}
								<option value={p._id}>{p.name} ({p.rating})</option>
							{/each}
						</select>
					</label>
					<fieldset>
						<legend class="with-icon">
							<Trophy size={14} aria-hidden="true" />
							Result
						</legend>
						<label class="radio">
							<input type="radio" name="result" value="white" bind:group={result} />
							<PieceColor color="white" size={10} />
							White wins
						</label>
						<label class="radio">
							<input type="radio" name="result" value="black" bind:group={result} />
							<PieceColor color="black" size={10} />
							Black wins
						</label>
						<label class="radio">
							<input type="radio" name="result" value="draw" bind:group={result} />
							<Minus size={12} aria-hidden="true" />
							Draw
						</label>
					</fieldset>
					<label>
						PGN / FEN (optional)
						<textarea name="notation" bind:value={notation} rows="3" placeholder="Paste PGN moves or FEN position…"></textarea>
					</label>
					<label>
						Time format
						<select name="timeFormat" bind:value={timeFormat} required>
							{#each data.timeFormatOptions as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
					</label>
					<button type="submit" class="with-icon" disabled={submitting}>
						<ClipboardPlus size={16} aria-hidden="true" />
						{submitting ? 'Saving…' : 'Log Match'}
					</button>
				</form>
			</section>

			<section class="http-submit">
				<h2>Submit via HTTP</h2>
				{#if data.apiSubmitEnabled}
					<p class="http-help">Log matches from scripts, smart boards, or other tools using the API.</p>
					<details>
						<summary>Full match API</summary>
						<div class="http-body">
							<p><strong>Endpoint:</strong> <code>POST {data.apiSubmitUrl}</code></p>
							<p><strong>Header:</strong> <code>Authorization: Bearer {data.apiSubmitKey}</code></p>
							<p><strong>Body (required unless noted):</strong></p>
							<pre>{`{
  "whitePlayerId": "PLAYER_ID",
  "blackPlayerId": "PLAYER_ID",
  "result": "white|black|draw",
  "notation": "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6",
  "timeFormat": "600+0"
}`}</pre>
							<p><strong>Example:</strong></p>
							<pre>{sampleCurl}</pre>
							<div class="copy-row">
								<button type="button" class="copy-btn with-icon" onclick={() => copyCurl(sampleCurl)}>
									<Copy size={14} aria-hidden="true" />
									Copy curl
								</button>
								{#if copyMsg}
									<span class="copy-msg">{copyMsg}</span>
								{/if}
							</div>
						</div>
					</details>
					<details>
						<summary>Board draft API (DGT + Raspberry Pi)</summary>
						<div class="http-body">
							<p><strong>Endpoint:</strong> <code>POST {data.apiDraftUrl}</code></p>
							<p>No player IDs — assign players on the <strong>Board drafts</strong> tab after upload.</p>
							<pre>{`{
  "result": "white|black|draw",
  "notation": "1. e4 e5 2. Nf3 ...",
  "timeFormat": "600+0"
}`}</pre>
							<p><strong>Example:</strong></p>
							<pre>{sampleDraftCurl}</pre>
							<div class="copy-row">
								<button type="button" class="copy-btn with-icon" onclick={() => copyCurl(sampleDraftCurl)}>
									<Copy size={14} aria-hidden="true" />
									Copy curl
								</button>
							</div>
							<p class="http-note">
								<a href="/guides/smart-board">Read the DGT board setup guide →</a>
							</p>
						</div>
					</details>
				{:else}
					<p class="http-disabled">
						Ask your admin to enable HTTP submissions in the admin panel.
					</p>
				{/if}
			</section>
		{/if}
	{/if}
</div>

<style>
	.submit-page {
		max-width: 480px;
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.submit-page.wide {
		max-width: 720px;
	}

	h1 { margin: 0; font-size: 1.2rem; font-weight: 600; color: var(--color-heading); }
	.subtitle { margin: 0; font-size: 0.9rem; color: var(--color-text-faint); }

	.mode-tabs {
		display: flex;
		gap: 0.5rem;
	}

	.mode-tabs button {
		flex: 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		padding: 0.55rem 0.75rem;
		border-radius: 8px;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text-subtle);
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
	}

	.mode-tabs button.active {
		background: var(--color-btn-primary-bg);
		color: var(--color-btn-primary-text);
		border-color: transparent;
	}

	.tab-count {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.25rem;
		height: 1.25rem;
		padding: 0 0.35rem;
		border-radius: 999px;
		background: rgb(255 255 255 / 0.2);
		font-size: 0.72rem;
	}

	.log-match, .drafts-panel {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 12px;
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.draft-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.empty-state h2 {
		margin: 0;
		font-size: 1rem;
		color: var(--color-heading);
	}

	.empty-state p {
		margin: 0;
		font-size: 0.88rem;
		color: var(--color-text-subtle);
		line-height: 1.5;
	}

	.endpoint-box {
		background: var(--color-input-bg);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		padding: 0.75rem 1rem;
	}

	.endpoint-box p {
		margin: 0 0 0.35rem;
		font-size: 0.82rem;
	}

	.endpoint-box code {
		font-size: 0.78rem;
		word-break: break-all;
	}

	.how-it-works h3 {
		margin: 0 0 0.35rem;
		font-size: 0.9rem;
		color: var(--color-heading);
	}

	.how-it-works ol {
		margin: 0;
		padding-left: 1.2rem;
		font-size: 0.85rem;
		color: var(--color-text-subtle);
		line-height: 1.6;
	}

	.guide-link {
		display: inline-flex;
		align-items: center;
		font-size: 0.88rem;
		font-weight: 600;
		color: var(--color-accent, var(--color-text));
		text-decoration: none;
	}

	.guide-link:hover {
		text-decoration: underline;
	}

	form { display: flex; flex-direction: column; gap: 0.75rem; }
	label { display: flex; flex-direction: column; gap: 4px; font-size: 0.82rem; color: var(--color-text-subtle); }
	.label-row { display: inline-flex; align-items: center; gap: 0.4rem; }
	legend.with-icon { display: inline-flex; align-items: center; gap: 0.35rem; }
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
		justify-content: center;
	}
	button:hover:not(:disabled) { opacity: 0.88; }
	button:disabled { opacity: 0.4; cursor: not-allowed; }
	.notice { font-size: 0.82rem; color: var(--color-warning); background: var(--color-notice-bg); border: 1px solid var(--color-notice-border); border-radius: 6px; padding: 8px 10px; margin: 0; align-items: flex-start; }
	.error { font-size: 0.82rem; color: var(--color-error); background: var(--color-error-bg); border: 1px solid var(--color-error-border); border-radius: 6px; padding: 8px 10px; margin: 0; }
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
		.http-submit,
		.drafts-panel {
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
