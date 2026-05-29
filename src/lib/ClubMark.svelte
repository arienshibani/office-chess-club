<script>
	import { ChessKnight } from '@lucide/svelte';

	let { size = 20, strokeWidth = 2, class: className = '', ...rest } = $props();
</script>

<ChessKnight {size} {strokeWidth} class="club-mark {className}" aria-hidden="true" {...rest} />

<style>
	:global(.club-mark) {
		flex-shrink: 0;
	}
</style>
