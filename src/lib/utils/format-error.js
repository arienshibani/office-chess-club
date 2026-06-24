/** @param {unknown} err */
export const errorDetails = (err) => {
	if (err instanceof Error) {
		return { message: err.message, stack: err.stack };
	}
	return { message: String(err), stack: undefined };
};
