<script>
import MatchReview from "$lib/components/matches/MatchReview.svelte";

const { data, form } = $props();
</script>

<svelte:head><title>Match — Office Chess Club</title></svelte:head>

<MatchReview {...data} {form} />
