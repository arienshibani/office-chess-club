<script>
	/** @type {{
	 *   checked?: boolean;
	 *   disabled?: boolean;
	 *   labelOn?: string;
	 *   labelOff?: string;
	 *   ariaLabel: string;
	 * }} */
	let {
		checked = false,
		disabled = false,
		labelOn = 'On',
		labelOff = 'Off',
		ariaLabel,
	} = $props();

	const label = $derived(checked ? labelOn : labelOff);
</script>

<div class="setting-switch-control">
	<span class="setting-switch-label" class:on={checked} aria-hidden="true">{label}</span>
	<button
		type="submit"
		class="setting-switch"
		class:on={checked}
		role="switch"
		aria-checked={checked}
		aria-label={`${ariaLabel}, ${checked ? 'on' : 'off'}`}
		{disabled}
	>
		<span class="setting-switch-track" aria-hidden="true">
			<span class="setting-switch-thumb"></span>
		</span>
	</button>
</div>

<style>
	.setting-switch-control {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		flex-shrink: 0;
	}

	.setting-switch-label {
		min-width: 1.75rem;
		font-size: 0.78rem;
		font-weight: 600;
		text-align: right;
		color: var(--color-switch-label-off);
		transition: color 0.2s ease;
	}

	.setting-switch-label.on {
		color: var(--color-switch-label-on);
	}

	.setting-switch {
		display: inline-flex;
		align-items: center;
		padding: 0;
		border: none;
		background: transparent;
		cursor: pointer;
	}

	.setting-switch:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.setting-switch-track {
		position: relative;
		display: block;
		width: 44px;
		height: 26px;
		border-radius: 999px;
		background: var(--color-switch-track-off);
		border: 1px solid var(--color-border-focus);
		transition:
			background 0.2s ease,
			border-color 0.2s ease;
	}

	.setting-switch.on .setting-switch-track {
		background: var(--color-switch-track-on);
		border-color: var(--color-switch-track-on);
	}

	.setting-switch-thumb {
		position: absolute;
		top: 3px;
		left: 3px;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--color-switch-thumb-off);
		box-shadow: 0 1px 3px rgb(0 0 0 / 0.28);
		transition:
			transform 0.2s ease,
			background 0.2s ease;
	}

	.setting-switch.on .setting-switch-thumb {
		transform: translateX(18px);
		background: var(--color-switch-thumb-on);
	}
</style>
