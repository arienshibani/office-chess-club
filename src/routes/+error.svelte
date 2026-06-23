<script>
	import { dev } from '$app/environment';
	import { page } from '$app/state';
	import ClubMark from '$lib/components/common/ClubMark.svelte';
	import ErrorAlert from '$lib/components/common/ErrorAlert.svelte';

	let { error, status } = $props();

	const title = $derived(
		status === 404
			? 'Page not found'
			: status === 403
				? 'Access denied'
				: 'Something went wrong',
	);

	const message = $derived(
		status === 404
			? "We couldn't find the page you're looking for."
			: status === 403
				? "You don't have permission to view this page."
				: (typeof error?.message === 'string' && error.message) ||
					'An unexpected error occurred. Please try again.',
	);

	const details = $derived(
		typeof error === 'object' &&
			error &&
			'details' in error &&
			typeof error.details === 'string'
			? error.details
			: '',
	);

	const stack = $derived(
		dev
			? typeof error === 'object' && error && 'stack' in error && typeof error.stack === 'string'
				? error.stack
				: error instanceof Error
					? error.stack
					: undefined
			: undefined,
	);
</script>

<svelte:head>
	<title>{status} — {title}</title>
</svelte:head>

<div class="error-page">
	<div class="error-card">
		<div class="brand">
			<ClubMark size={40} strokeWidth={2} />
			<p class="status-code">{status}</p>
		</div>

		<h1>{title}</h1>
		<p class="lead">{message}</p>

		{#if details || stack}
			<ErrorAlert message={details || message} {stack} title="Server log" compact />
		{/if}

		{#if dev && page.url.pathname}
			<p class="route">
				<span class="route-label">Route</span>
				<code>{page.url.pathname}{page.url.search}</code>
			</p>
		{/if}

		<div class="actions">
			<button type="button" class="primary" onclick={() => history.back()}>Go back</button>
			<a href="/" class="secondary">Home</a>
		</div>
	</div>
</div>

<style>
	.error-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		background:
			radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255, 255, 255, 0.06), transparent),
			var(--color-bg);
	}

	.error-card {
		width: 100%;
		max-width: 520px;
		padding: 1.75rem;
		border-radius: 14px;
		border: 1px solid var(--color-border-strong);
		background: var(--color-surface-raised);
		box-shadow: 0 24px 48px rgba(0, 0, 0, 0.35);
	}

	.brand {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.35rem;
		margin-bottom: 1rem;
	}

	.status-code {
		margin: 0;
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		color: var(--color-error);
	}

	h1 {
		margin: 0 0 0.35rem;
		text-align: center;
		font-size: 1.5rem;
		color: var(--color-heading);
	}

	.lead {
		margin: 0 0 1.25rem;
		text-align: center;
		font-size: 0.92rem;
		line-height: 1.5;
		color: var(--color-text-subtle);
	}

	.route {
		margin: 0 0 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.78rem;
	}

	.route-label {
		font-weight: 600;
		color: var(--color-text-faint);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.route code {
		padding: 0.5rem 0.65rem;
		border-radius: 6px;
		background: var(--color-surface-muted);
		border: 1px solid var(--color-border);
		color: var(--color-text-code);
		word-break: break-all;
	}

	.actions {
		display: flex;
		gap: 0.65rem;
	}

	.primary,
	.secondary {
		flex: 1;
		text-align: center;
		padding: 0.7rem 1rem;
		border-radius: 8px;
		font-size: 0.88rem;
		font-weight: 600;
		text-decoration: none;
		cursor: pointer;
	}

	.primary {
		border: none;
		background: var(--color-btn-primary-bg);
		color: var(--color-btn-primary-text);
	}

	.primary:hover {
		opacity: 0.92;
	}

	.secondary {
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid var(--color-border-strong);
		background: var(--color-btn-secondary-bg);
		color: var(--color-btn-secondary-text);
	}

	.secondary:hover {
		background: var(--color-surface-hover);
	}

	@media (max-width: 640px) {
		.error-page {
			align-items: flex-start;
			padding: 1rem;
			padding-top: max(1rem, env(safe-area-inset-top));
		}

		.error-card {
			padding: 1.25rem;
		}

		.actions {
			flex-direction: column;
		}
	}
</style>
