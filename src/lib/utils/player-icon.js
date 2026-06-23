/** @param {string} raw */
export const normalizePlayerIcon = (raw) => {
	const trimmed = raw.trim();
	if (!trimmed) return '';
	// Keep a single emoji / grapheme cluster, max 8 code units for ZWJ sequences.
	return [...trimmed].slice(0, 4).join('').slice(0, 8);
};
