import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { AccountBlockedError, SessionExpiredError } from "../../services/apis/apiClient";
import { reportService } from "../../services/reportService";
import type { PeriodReport } from "../../types/reports";
import { getErrorMessage } from "../../utils/errors";
import { type ReportPeriod, toMonthKey } from "./reportPeriods";

/**
 * Loads the weekly or monthly report for `anchor` (yyyy-MM-dd) whenever the screen is focused or the
 * period/anchor changes. Does nothing for the daily period (that one is computed on the device).
 * If the user changes period or date while a request is still running, only the latest answer is kept.
 */
export const usePeriodReport = (period: ReportPeriod, anchor: string) => {
	const [report, setReport] = useState<PeriodReport | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const latestRequest = useRef(0);

	const reload = useCallback(async () => {
		if (period === "daily") {
			return;
		}

		const requestId = ++latestRequest.current;
		setIsLoading(true);
		setError(null);

		try {
			const data =
				period === "weekly"
					? await reportService.getWeekly(anchor)
					: await reportService.getMonthly(toMonthKey(anchor));
			if (requestId === latestRequest.current) {
				setReport(data);
			}
		} catch (err: unknown) {
			// Session expiry and account blocking are already surfaced globally by apiFetch.
			if (requestId !== latestRequest.current || err instanceof SessionExpiredError || err instanceof AccountBlockedError) {
				return;
			}
			setReport(null);
			setError(getErrorMessage(err));
		} finally {
			if (requestId === latestRequest.current) {
				setIsLoading(false);
			}
		}
	}, [anchor, period]);

	useFocusEffect(
		useCallback(() => {
			void reload();
		}, [reload]),
	);

	// Never hand out the previous period's report while the new one is still loading.
	const current = report && report.periodType === period ? report : null;

	return { error, isLoading, reload, report: current };
};
