/** @param {{ hypothesisId: string, location: string, message: string, data?: Record<string, unknown>, runId?: string }} entry */
export const debugLog = ({ hypothesisId, location, message, data = {}, runId = 'pre-fix' }) => {
	// #region agent log
	fetch('http://127.0.0.1:7246/ingest/02481046-40d1-48f2-8a89-19a2dcfb9174', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-Debug-Session-Id': 'b71ba4'
		},
		body: JSON.stringify({
			sessionId: 'b71ba4',
			hypothesisId,
			location,
			message,
			data,
			runId,
			timestamp: Date.now()
		})
	}).catch(() => {});
	// #endregion
};
