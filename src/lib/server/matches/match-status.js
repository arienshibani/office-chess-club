/** @typedef {'draft' | 'pending' | 'approved'} MatchStatus */

export const MATCH_STATUS_DRAFT = /** @type {const} */ ('draft');
export const MATCH_STATUS_PENDING = /** @type {const} */ ('pending');
export const MATCH_STATUS_APPROVED = /** @type {const} */ ('approved');

/** Matches visible in public lists and player histories. */
export const PUBLIC_MATCH_FILTER = { status: { $nin: [MATCH_STATUS_DRAFT] } };
