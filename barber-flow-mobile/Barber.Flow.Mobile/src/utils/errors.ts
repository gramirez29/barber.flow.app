/**
 * Extracts a human-readable message from an unknown catch value.
 * Use as: catch (err: unknown) { setError(getErrorMessage(err)); }
 */
export const getErrorMessage = (err: unknown): string => {
	if (err instanceof Error) {
		return err.message;
	}
	if (typeof err === "string") {
		return err;
	}
	if (
		err !== null &&
		typeof err === "object" &&
		"message" in err &&
		typeof (err as Record<string, unknown>).message === "string"
	) {
		return (err as Record<string, unknown>).message as string;
	}
	return "An unexpected error occurred";
};
