<script>
	import { arrowLine, squareToPercent } from '$lib/chess-arrows.js';

	/** @type {{ from: string, to: string } | null | undefined} */
	let { arrow = null } = $props();

	let line = $derived.by(() => {
		if (!arrow) return null;
		const from = squareToPercent(arrow.from);
		const to = squareToPercent(arrow.to);
		return arrowLine(from, to);
	});
</script>

{#if line}
	<svg class="board-arrows" viewBox="0 0 100 100" aria-hidden="true">
		<defs>
			<marker
				id="suggestion-arrowhead"
				markerWidth="4"
				markerHeight="4"
				refX="3"
				refY="2"
				orient="auto"
			>
				<path d="M0,0 L4,2 L0,4 Z" class="arrowhead" />
			</marker>
		</defs>
		<line
			x1={line.x1}
			y1={line.y1}
			x2={line.x2}
			y2={line.y2}
			class="suggestion-arrow"
			marker-end="url(#suggestion-arrowhead)"
		/>
	</svg>
{/if}

<style>
	.board-arrows {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 2;
	}

	.suggestion-arrow {
		stroke: var(--color-suggestion-arrow, #9a9a9a);
		stroke-width: 1.35;
		stroke-dasharray: 2.5 1.8;
		stroke-linecap: round;
		opacity: 0.92;
		fill: none;
	}

	.arrowhead {
		fill: var(--color-suggestion-arrow, #9a9a9a);
		opacity: 0.92;
	}
</style>
