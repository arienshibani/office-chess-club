import { json } from '@sveltejs/kit';
import { getPlayers, ObjectId } from '$lib/db.js';
import { normalizeTheme } from '$lib/theme.js';

/** @type {import('./$types').RequestHandler} */
export const POST = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Not authenticated.' }, { status: 401 });
	}

	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid request body.' }, { status: 400 });
	}

	const theme = normalizeTheme(body?.theme);
	const playersCol = await getPlayers();

	await playersCol.updateOne(
		{ _id: new ObjectId(locals.user._id) },
		{ $set: { theme } }
	);

	return json({ success: true, theme });
};
