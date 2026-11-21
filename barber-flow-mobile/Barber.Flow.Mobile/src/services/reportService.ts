import { apiFetch } from "./apis/apiClient";
import { mapPeriodReport } from "./reportMappers";
import type { PeriodReport } from "../types/reports";

export const reportService = {
	/** Week (Sunday to Saturday) containing `date` (yyyy-MM-dd). */
	getWeekly: async (date: string): Promise<PeriodReport> =>
		mapPeriodReport(await apiFetch(`/api/reports/weekly?date=${encodeURIComponent(date)}`, { method: "GET" })),

	/** Calendar month `month` (yyyy-MM). */
	getMonthly: async (month: string): Promise<PeriodReport> =>
		mapPeriodReport(await apiFetch(`/api/reports/monthly?month=${encodeURIComponent(month)}`, { method: "GET" })),
};
