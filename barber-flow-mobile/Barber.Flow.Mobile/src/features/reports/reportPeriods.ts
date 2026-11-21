import { addDays, addMonths, format, startOfWeek } from "date-fns";

/** Periods of the reports screen. Daily is computed on the device; weekly and monthly come from the backend. */
export type ReportPeriod = "daily" | "weekly" | "monthly";

export const REPORT_PERIODS: ReportPeriod[] = ["daily", "weekly", "monthly"];

const DATE_KEY_FORMAT = "yyyy-MM-dd";

/** "yyyy-MM-dd" -> Date at LOCAL midnight (new Date("2026-11-18") would be UTC and can land on the previous day). */
export const parseDateKey = (dateKey: string): Date => {
	const [year, month, day] = dateKey.split("-").map(Number);
	return new Date(year, month - 1, day);
};

export const toDateKey = (date: Date): string => format(date, DATE_KEY_FORMAT);

/** "2026-11-18" -> "2026-11" */
export const toMonthKey = (dateKey: string): string => dateKey.slice(0, 7);

/** The Sunday-to-Saturday week containing the date (same rule as the backend). */
export const getWeekRange = (dateKey: string): { from: string; to: string } => {
	const start = startOfWeek(parseDateKey(dateKey), { weekStartsOn: 0 });
	return { from: toDateKey(start), to: toDateKey(addDays(start, 6)) };
};

/** Moves the anchor one period back (-1) or forward (+1). */
export const shiftAnchor = (period: ReportPeriod, dateKey: string, direction: -1 | 1): string => {
	const date = parseDateKey(dateKey);
	switch (period) {
		case "weekly":
			return toDateKey(addDays(date, 7 * direction));
		case "monthly":
			return toDateKey(addMonths(date, direction));
		default:
			return toDateKey(addDays(date, direction));
	}
};

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const stripDots = (text: string) => text.replace(/\./g, "");

// Weekday and month come from Intl (so they follow the app language); the day number is added by hand so
// both languages share one layout: "lun 16 nov" / "Mon 16 Nov" (Intl alone puts commas and the day in
// different places depending on the locale).
const weekdayOf = (date: Date, locale: string) =>
	stripDots(new Intl.DateTimeFormat(locale, { weekday: "short" }).format(date));

const monthOf = (date: Date, locale: string) =>
	stripDots(new Intl.DateTimeFormat(locale, { month: "short" }).format(date));

/** "lun 16 nov" */
export const formatDayLabel = (dateKey: string, locale: string): string => {
	const date = parseDateKey(dateKey);
	return `${weekdayOf(date, locale)} ${date.getDate()} ${monthOf(date, locale)}`;
};

/** "dom 15 – sáb 21 nov" (or "dom 29 nov – sáb 5 dic" when the week crosses a month). */
export const formatWeekLabel = (dateKey: string, locale: string): string => {
	const { from, to } = getWeekRange(dateKey);
	const start = parseDateKey(from);
	const end = parseDateKey(to);
	const left =
		start.getMonth() === end.getMonth()
			? `${weekdayOf(start, locale)} ${start.getDate()}`
			: `${weekdayOf(start, locale)} ${start.getDate()} ${monthOf(start, locale)}`;
	return `${left} – ${weekdayOf(end, locale)} ${end.getDate()} ${monthOf(end, locale)}`;
};

/** "Noviembre de 2026" */
export const formatMonthLabel = (dateKey: string, locale: string): string =>
	capitalize(new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(parseDateKey(dateKey)));
