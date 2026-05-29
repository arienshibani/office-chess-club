<script>
	import { Circle } from '@lucide/svelte';

	/** @type {{ color?: 'white' | 'black', size?: number, class?: string }} */
	let { color = 'white', size = 12, class: className = '' } = $props();
</script>

<span class="piece-color {color} {className}" aria-hidden="true">
	<Circle {size} strokeWidth={1.75} />
</span>

<style>
	.piece-color {
		display: inline-flex;
		vertical-align: middle;
		flex-shrink: 0;
	}

	.piece-color :global(svg) {
		stroke: currentColor;
	}

	/* Dark mode */
	.piece-color.white {
		color: #f5f5f5;
	}

	.piece-color.white :global(circle) {
		fill: currentColor;
		stroke: currentColor;
	}

	.piece-color.black {
		color: #b8b8b8;
	}

	.piece-color.black :global(circle) {
		fill: none;
		stroke: currentColor;
	}

	/* Light mode */
	:global([data-theme='light']) .piece-color.white {
		color: #737373;
	}

	:global([data-theme='light']) .piece-color.white :global(circle) {
		fill: none;
		stroke: currentColor;
	}

	:global([data-theme='light']) .piece-color.black {
		color: #1a1a1a;
	}

	:global([data-theme='light']) .piece-color.black :global(circle) {
		fill: currentColor;
		stroke: currentColor;
	}
</style>
