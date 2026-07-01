<script>
	import { ArrowLeft, ExternalLink } from '@lucide/svelte';
</script>

<svelte:head><title>DGT board setup — Office Chess Club</title></svelte:head>

<div class="guide-page">
	<a class="back-link with-icon" href="/submit?tab=drafts">
		<ArrowLeft size={16} aria-hidden="true" />
		Back to board drafts
	</a>

	<h1>Smart board setup</h1>
	<p class="lede">
		Connect a DGT electronic board and Raspberry Pi to automatically upload games to your club.
		After each game, members assign players on the <strong>Board drafts</strong> tab.
	</p>

	<section>
		<h2>What you need</h2>
		<ul>
			<li>A DGT e-Board with USB connection</li>
			<li>A Raspberry Pi (or Linux PC) running Python 3.11+</li>
			<li>HTTP submissions enabled in Admin → Advanced, with an API key</li>
			<li>Your club URL reachable from the Pi on your network</li>
		</ul>
	</section>

	<section>
		<h2>How it works</h2>
		<ol>
			<li>Set up the starting position on the board — the Pi starts recording automatically.</li>
			<li>Play the game on the physical board.</li>
			<li>When finished, place both kings on the center squares (DGT result convention):
				<ul>
					<li><strong>White wins:</strong> kings on e4 and d5</li>
					<li><strong>Black wins:</strong> kings on d4 and e5</li>
					<li><strong>Draw:</strong> one king on a light square, one on a dark square (e.g. e4 + e5)</li>
				</ul>
			</li>
			<li>The Pi uploads PGN + result to <code>POST /api/matches/draft</code>.</li>
			<li>On the website, open <strong>Submit results → Board drafts</strong>, pick White and Black, and log the match.</li>
			<li>Reset the board to the starting position for the next game.</li>
		</ol>
	</section>

	<section>
		<h2>Pi setup (summary)</h2>
		<p>
			The recorder lives in the <code>smart-board-assistant/</code> folder in this repository.
			Copy it to your Pi, configure <code>.env</code>, and run the install script:
		</p>
		<pre>{`cd smart-board-assistant
cp config.example.env .env
# Set OCC_API_BASE_URL and OCC_API_KEY
./install.sh
INSTALL_SYSTEMD=1 ./install.sh   # auto-start on boot`}</pre>
		<p>
			<a
				class="external-link with-icon"
				href="https://github.com/arienshibani/office-chess-club/tree/main/smart-board-assistant"
				target="_blank"
				rel="noopener noreferrer"
			>
				<ExternalLink size={14} aria-hidden="true" />
				Full technical README on GitHub
			</a>
		</p>
	</section>

	<section>
		<h2>Tips</h2>
		<ul>
			<li>Lift both kings before placing them on the result squares so the illegal move is not recorded.</li>
			<li>If upload fails, leave the result kings in place — the Pi will retry.</li>
			<li>Ask your admin to enable HTTP submissions and share the API key with whoever maintains the Pi.</li>
		</ul>
	</section>
</div>

<style>
	.guide-page {
		max-width: 640px;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.back-link {
		font-size: 0.85rem;
		color: var(--color-text-subtle);
		text-decoration: none;
		width: fit-content;
	}

	.back-link:hover {
		color: var(--color-text);
	}

	h1 {
		margin: 0;
		font-size: 1.35rem;
		color: var(--color-heading);
	}

	.lede {
		margin: 0;
		font-size: 0.95rem;
		color: var(--color-text-subtle);
		line-height: 1.6;
	}

	section h2 {
		margin: 0 0 0.5rem;
		font-size: 1rem;
		color: var(--color-heading);
	}

	section ul,
	section ol {
		margin: 0;
		padding-left: 1.25rem;
		font-size: 0.9rem;
		color: var(--color-text-subtle);
		line-height: 1.6;
	}

	section li + li {
		margin-top: 0.35rem;
	}

	pre {
		margin: 0.5rem 0 0;
		background: var(--color-input-bg);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		padding: 0.75rem 1rem;
		font-size: 0.78rem;
		overflow-x: auto;
	}

	code {
		font-size: 0.85em;
	}

	.external-link {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.88rem;
		font-weight: 600;
		color: var(--color-text);
	}
</style>
