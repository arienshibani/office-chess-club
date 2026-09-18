import { json } from '@sveltejs/kit';
import { Chess } from 'chess.js';
import { detectNotationType } from '$lib/chess/notation.js';
import { getMatches, ObjectId } from '$lib/server/db.js';
import { parseAnalysisPayload } from '$lib/server/matches/match-analysis.js';
import { MATCH_STATUS_DRAFT } from '$lib/server/matches/match-status.js';

const methodNotAllowed = () => json({ error: 'Method not allowed.' }, { status: 405 });

/** @param {unknown} notation */
const pgnMoveCount = (notation) => {
	if (typeof notation !== 'string' || detectNotationType(notation) !== 'pgn') return null;
	try {
		const chess = new Chess();
		chess.loadPgn(notation);
		return chess.history().length;
	} catch {
		return null;
	}
};

/** @type {import('./$types').RequestHandler} */
export const POST = async ({ request, params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Not authenticated.' }, { status: 401 });
	}

	let oid;
	try {
		oid = new ObjectId(params.id);
	} catch {
		return json({ error: 'Match not found.' }, { status: 404 });
	}

	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid request body.' }, { status: 400 });
	}

	const matchesCol = await getMatches();
	const match = await matchesCol.findOne({ _id: oid });
	if (!match || match.status === MATCH_STATUS_DRAFT) {
		return json({ error: 'Match not found.' }, { status: 404 });
	}

	const moveCount = pgnMoveCount(match.notation);
	if (moveCount == null || moveCount === 0) {
		return json({ error: 'Match has no replayable PGN.' }, { status: 400 });
	}

	const parsed = parseAnalysisPayload(body, { expectedPlyCount: moveCount });
	if (!parsed.ok) {
		return json({ error: parsed.error }, { status: 400 });
	}

	const force = body?.force === true;
	const filter = force ? { _id: oid } : { _id: oid, analysis: { $exists: false } };

	const result = await matchesCol.updateOne(filter, { $set: { analysis: parsed.analysis } });

	if (!force && result.matchedCount === 0) {
		const existing = await matchesCol.findOne({ _id: oid }, { projection: { analysis: 1 } });
		if (existing?.analysis) {
			return json({
				success: true,
				saved: false,
				reason: 'already_exists',
				analysis: {
					depth: existing.analysis.depth,
					engine: existing.analysis.engine,
					analyzedAt:
						existing.analysis.analyzedAt instanceof Date
							? existing.analysis.analyzedAt.toISOString()
							: (existing.analysis.analyzedAt ?? null),
					positions: existing.analysis.positions,
				},
			});
		}
		return json({ error: 'Match not found.' }, { status: 404 });
	}

	return json({
		success: true,
		saved: true,
		analysis: {
			depth: parsed.analysis.depth,
			engine: parsed.analysis.engine,
			analyzedAt: parsed.analysis.analyzedAt.toISOString(),
			positions: parsed.analysis.positions,
		},
	});
};

export const GET = methodNotAllowed;
export const PUT = methodNotAllowed;
export const PATCH = methodNotAllowed;
export const DELETE = methodNotAllowed;
