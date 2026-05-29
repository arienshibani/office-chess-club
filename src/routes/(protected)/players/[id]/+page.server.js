import { getPlayers, getMatches, ObjectId } from '$lib/db.js';
import { normalizePlayerIcon } from '$lib/player-icon.js';
import { hashPassword, verifyPassword } from '$lib/password.js';
import { normalizeTheme } from '$lib/theme.js';
import { error, fail } from '@sveltejs/kit';

/** @param {import('@sveltejs/kit').RequestEvent} event */
const assertOwnProfile = ({ locals, params }) => {
	if (!locals.user) return fail(401, { error: 'Not authenticated.' });
	if (locals.user._id !== params.id) return fail(403, { error: 'Forbidden.' });
	return null;
};

/** @type {import('./$types').PageServerLoad} */
export async function load({ params, locals, depends }) {
	depends(`app:player:${params.id}`);

	let oid;
	try {
		oid = new ObjectId(params.id);
	} catch {
		error(404, 'Player not found');
	}

	const [playersCol, matchesCol] = await Promise.all([getPlayers(), getMatches()]);

	const [player, allPlayers] = await Promise.all([
		playersCol.findOne({ _id: oid }),
		playersCol.find({}).sort({ rating: -1 }).toArray()
	]);

	if (!player) error(404, 'Player not found');

	const rank = allPlayers.findIndex((p) => p._id.toString() === params.id) + 1;

	const matches = await matchesCol
		.find({
			$or: [{ whitePlayerId: oid }, { blackPlayerId: oid }]
		})
		.sort({ playedAt: -1 })
		.limit(50)
		.toArray();

	// Collect opponent IDs
	const opponentIds = [
		...new Set(
			matches.map((m) =>
				m.whitePlayerId.toString() === params.id
					? m.blackPlayerId.toString()
					: m.whitePlayerId.toString()
			)
		)
	];

	const opponents = await playersCol
		.find({ _id: { $in: opponentIds.map((id) => new ObjectId(id)) } })
		.toArray();

	const oppMap = Object.fromEntries(opponents.map((p) => [p._id.toString(), p]));

	const enriched = matches.map((m) => {
		const isWhite = m.whitePlayerId.toString() === params.id;
		const opponentId = isWhite ? m.blackPlayerId.toString() : m.whitePlayerId.toString();
		const opponent = oppMap[opponentId];
		const playerElo = isWhite ? m.eloChange.white : m.eloChange.black;
		const won = m.winnerId?.toString() === params.id;
		const lost = !m.isDraw && m.winnerId?.toString() !== params.id;

		return {
			_id: m._id.toString(),
			opponentId,
			opponentName: opponent?.name ?? 'Unknown',
			opponentIcon: opponent?.icon ?? '',
			opponentAvatar: opponent?.avatarUrl ?? '',
			isWhite,
			isDraw: m.isDraw,
			won,
			lost,
			status: m.status,
			eloBefore: playerElo.before,
			eloAfter: playerElo.after,
			eloChange: playerElo.after - playerElo.before,
			playedAt: m.playedAt
		};
	});

	return {
		player: {
			_id: player._id.toString(),
			name: /** @type {string} */ (player.name),
			icon: typeof player.icon === 'string' ? player.icon : '',
			avatarUrl: /** @type {string} */ (player.avatarUrl ?? ''),
			rating: /** @type {number} */ (player.rating),
			isAdmin: /** @type {boolean} */ (player.isAdmin),
			stats: /** @type {{ wins: number, losses: number, draws: number }} */ (player.stats),
			theme: normalizeTheme(player.theme)
		},
		matches: enriched,
		rank,
		isOwnProfile: locals.user?._id === params.id
	};
}

/** @type {import('./$types').Actions} */
export const actions = {
	updateProfile: async (event) => {
		const denied = assertOwnProfile(event);
		if (denied) return denied;

		const data = await event.request.formData();
		const name = String(data.get('name') ?? '').trim();
		const icon = normalizePlayerIcon(String(data.get('icon') ?? ''));
		const theme = normalizeTheme(String(data.get('theme') ?? ''));

		if (!name) return fail(400, { profileError: 'Display name is required.', action: 'updateProfile' });
		if (name.length > 80) {
			return fail(400, { profileError: 'Display name is too long.', action: 'updateProfile' });
		}

		const playersCol = await getPlayers();
		await playersCol.updateOne(
			{ _id: new ObjectId(event.params.id) },
			{ $set: { name, icon, theme } }
		);

		return { profileSuccess: true, action: 'updateProfile', message: 'Profile updated.' };
	},

	changePassword: async (event) => {
		const denied = assertOwnProfile(event);
		if (denied) return denied;

		const data = await event.request.formData();
		const currentPassword = String(data.get('currentPassword') ?? '');
		const newPassword = String(data.get('newPassword') ?? '');
		const confirmPassword = String(data.get('confirmPassword') ?? '');

		if (!currentPassword || !newPassword) {
			return fail(400, {
				passwordError: 'Current and new password are required.',
				action: 'changePassword'
			});
		}
		if (newPassword.length < 4) {
			return fail(400, {
				passwordError: 'New password must be at least 4 characters.',
				action: 'changePassword'
			});
		}
		if (confirmPassword && newPassword !== confirmPassword) {
			return fail(400, { passwordError: 'New passwords do not match.', action: 'changePassword' });
		}

		const playersCol = await getPlayers();
		const player = await playersCol.findOne({ _id: new ObjectId(event.params.id) });
		if (!player || typeof player.passwordHash !== 'string') {
			return fail(400, { passwordError: 'Unable to change password.', action: 'changePassword' });
		}
		if (!(await verifyPassword(currentPassword, player.passwordHash))) {
			return fail(401, { passwordError: 'Current password is incorrect.', action: 'changePassword' });
		}

		const passwordHash = await hashPassword(newPassword);
		await playersCol.updateOne({ _id: player._id }, { $set: { passwordHash } });

		return { passwordSuccess: true, action: 'changePassword', message: 'Password updated.' };
	}
};
