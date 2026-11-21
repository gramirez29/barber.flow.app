export type ReportPeriodType = "weekly" | "monthly";

export interface PeriodReportPaymentBreakdown {
	appointmentCount: number;
	label: string;
	// "cash" | "sinpeMovil" | "transfer" | "none"
	paymentMethod: string;
	total: number;
}

export interface PeriodReportDay {
	commissionAmount: number;
	date: string; // yyyy-MM-dd
	fixedExpense: number;
	grossRevenue: number;
	netProfit: number;
	totalCustomersServed: number;
}

/**
 * Weekly (Sunday to Saturday) or monthly report from the backend. Same figures as the daily report for the
 * whole period, plus one entry per day.
 */
export interface PeriodReport {
	commissionAmount: number;
	countedDays: number; // days the fixed daily expense was charged for (up to today while the period is running)
	days: PeriodReportDay[];
	fixedDailyExpense: number; // the expense of ONE day
	fixedExpenseTotal: number; // fixedDailyExpense x countedDays
	from: string; // yyyy-MM-dd
	grossRevenue: number;
	netProfit: number;
	paymentMethodBreakdown: PeriodReportPaymentBreakdown[];
	periodType: ReportPeriodType;
	to: string; // yyyy-MM-dd
	totalCustomersServed: number;
}
