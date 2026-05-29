import { invalidate } from '$app/navigation';
import toast from 'svelte-french-toast';

export { toast };

/**
 * @param {import('@sveltejs/kit').ActionResult} result
 */
export const toastFromResult = (result) => {
	if (result.type === 'success') {
		const data = /** @type {Record<string, unknown>} */ (result.data ?? {});
		if (typeof data.message === 'string') {
			toast.success(data.message);
		}
		return;
	}

	if (result.type === 'failure') {
		const data = /** @type {Record<string, unknown>} */ (result.data ?? {});
		const message = data.error ?? data.profileError ?? data.passwordError;
		if (typeof message === 'string') {
			toast.error(message);
		}
		return;
	}

	if (result.type === 'error') {
		toast.error('Something went wrong. Please try again.');
	}
};

/**
 * @param {{ redirectMessage?: string, invalidate?: string[] }} [options]
 */
export const withActionToast = (options = {}) => async ({ result, update }) => {
	await update({ invalidateAll: true });

	if (options.invalidate?.length) {
		await Promise.all(options.invalidate.map((key) => invalidate(key)));
	}

	if (result.type === 'redirect' && options.redirectMessage) {
		toast.success(options.redirectMessage);
	} else {
		toastFromResult(result);
	}
};

/** Keys for targeted admin/config reloads after settings change. */
export const ADMIN_INVALIDATE = ['app:admin', 'app:config'];
