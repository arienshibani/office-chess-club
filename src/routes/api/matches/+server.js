import { json } from '@sveltejs/kit';
import { assertApiKey } from '$lib/api-auth.js';
import { createMatch } from '$lib/match-submit.js';

const ALLOWED_RESULTS = new Set(['white', 'black', 'draw']);

const methodNotAllowed = () =>
	json({ error: 'Method not allowed' }, { status: 405, headers: { Allow: 'POST' } });

/**
 * @param {unknown} payload
 */
const parsePayload = (payload) => {
	if (!payload || typeof payload !== 'object') {
		return { ok: false, status: 400, error: 'Invalid JSON body' };
	}

	const data = /** @type {{ whitePlayerId?: unknown; blackPlayerId?: unknown; result?: unknown; notation?: unknown }} */ (
		payload
	);

	if (
		typeof data.whitePlayerId !== 'string' ||
		typeof data.blackPlayerId !== 'string' ||
		typeof data.result !== 'string' ||
		typeof data.notation !== 'string' ||
		!data.whitePlayerId.trim() ||
		!data.blackPlayerId.trim() ||
		!data.result.trim() ||
		!data.notation.trim()
	) {
		return { ok: false, status: 400, error: 'Missing required fields' };
	}

	if (!ALLOWED_RESULTS.has(data.result)) {
		return { ok: false, status: 400, error: 'Invalid result' };
	}

	return {
		ok: true,
		value: {
			whitePlayerId: data.whitePlayerId.trim(),
			blackPlayerId: data.blackPlayerId.trim(),
			result: /** @type {'white' | 'black' | 'draw'} */ (data.result),
			notation: data.notation
		}
	};
};

/** @type {import('./$types').RequestHandler} */
export const POST = async ({ request }) => {
	const auth = assertApiKey(request);
	if (!auth.ok) return json({ error: auth.message }, { status: auth.status });

	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	const parsed = parsePayload(body);
	if (!parsed.ok) return json({ error: parsed.error }, { status: parsed.status });

	try {
		const { matchId, status } = await createMatch({
			...parsed.value,
			reportedBy: null,
			reporterName: 'External API',
			requireNotation: true
		});

		return json({ ok: true, matchId, status }, { status: 201 });
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err && 'message' in err) {
			return json(
				{ error: /** @type {string} */ (err.message) },
				{ status: /** @type {number} */ (err.status) }
			);
		}
		throw err;
	}
};

/** @type {import('./$types').RequestHandler} */
export const GET = methodNotAllowed;
/** @type {import('./$types').RequestHandler} */
export const PUT = methodNotAllowed;
/** @type {import('./$types').RequestHandler} */
export const PATCH = methodNotAllowed;
/** @type {import('./$types').RequestHandler} */
export const DELETE = methodNotAllowed;
