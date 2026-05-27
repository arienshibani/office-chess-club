<script>
	import '../app.css';
	import ThemeApplier from '$lib/ThemeApplier.svelte';

	let { data, children } = $props();
</script>

<ThemeApplier theme={data.theme} />

<svelte:head>
	<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
</svelte:head>

{@render children()}
