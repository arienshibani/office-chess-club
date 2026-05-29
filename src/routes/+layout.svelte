<script>
	import '../app.css';
	import ThemeApplier from '$lib/ThemeApplier.svelte';
	import { Toaster } from 'svelte-french-toast';

	let { data, children } = $props();
</script>

<ThemeApplier theme={data.theme} />

<Toaster position="bottom-end" toastOptions={{ duration: 3500 }} />

<svelte:head>
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
	<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
</svelte:head>

{@render children()}
