/** Colones formatted for the given Intl locale (same format the daily report uses). */
export const formatCurrency = (value: number, locale: string): string =>
	new Intl.NumberFormat(locale, {
		currency: "CRC",
		maximumFractionDigits: 2,
		minimumFractionDigits: 2,
		style: "currency",
	}).format(value);
