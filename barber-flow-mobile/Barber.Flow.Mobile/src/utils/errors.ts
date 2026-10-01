/**
 * True when the backend rejected an appointment because another one already holds that exact
 * date+time (400 code "SLOT_TAKEN"). It is a business rule, not a failure, so it is shown as a warning.
 */
export const isSlotTakenError = (err: unknown): boolean =>
	err !== null && typeof err === "object" && (err as { code?: unknown }).code === "SLOT_TAKEN";

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
