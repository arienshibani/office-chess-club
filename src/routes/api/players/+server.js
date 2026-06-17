import { json } from '@sveltejs/kit';
import { assertApiKey } from '$lib/api-auth.js';
import { getPlayers } from '$lib/db.js';
import { normalizePlayerStatus } from '$lib/player-status.js';

const methodNotAllowed = () =>
	json({ error: 'Method not allowed' }, { status: 405, headers: { Allow: 'GET' } });

/** @type {import('./$types').RequestHandler} */
export const GET = async ({ request }) => {
	const auth = await assertApiKey(request);
	if (!auth.ok) return json({ error: auth.message }, { status: auth.status });

	const playersCol = await getPlayers();
	const players = await playersCol.find({}).sort({ name: 1 }).toArray();

	return json({
		ok: true,
		players: players.map((player) => ({
			_id: player._id.toString(),
			name: typeof player.name === 'string' ? player.name : '',
			username: typeof player.username === 'string' ? player.username : '',
			rating: typeof player.rating === 'number' ? player.rating : 1200,
			status: normalizePlayerStatus(player.status),
			isAdmin: !!player.isAdmin,
			createdAt: player.createdAt instanceof Date ? player.createdAt.toISOString() : null
		}))
	});
};

/** @type {import('./$types').RequestHandler} */
export const POST = methodNotAllowed;
/** @type {import('./$types').RequestHandler} */
export const PUT = methodNotAllowed;
/** @type {import('./$types').RequestHandler} */
export const PATCH = methodNotAllowed;
/** @type {import('./$types').RequestHandler} */
export const DELETE = methodNotAllowed;
