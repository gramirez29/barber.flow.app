import type { PeriodReport, PeriodReportDay, PeriodReportPaymentBreakdown } from "../types/reports";

// The backend answers camelCase, but the other services also tolerate PascalCase, so do the same here.
// Kept free of React Native imports so it can be exercised outside the app.
type Raw = Record<string, any>;

const num = (value: unknown): number => (typeof value === "number" ? value : Number(value ?? 0));

const mapBreakdown = (item: Raw): PeriodReportPaymentBreakdown => ({
	appointmentCount: num(item.appointmentCount ?? item.AppointmentCount),
	label: String(item.label ?? item.Label ?? ""),
	paymentMethod: String(item.paymentMethod ?? item.PaymentMethod ?? "none"),
	total: num(item.total ?? item.Total),
});

const mapDay = (day: Raw): PeriodReportDay => ({
	commissionAmount: num(day.commissionAmount ?? day.CommissionAmount),
	date: String(day.date ?? day.Date ?? ""),
	fixedExpense: num(day.fixedExpense ?? day.FixedExpense),
	grossRevenue: num(day.grossRevenue ?? day.GrossRevenue),
	netProfit: num(day.netProfit ?? day.NetProfit),
	totalCustomersServed: num(day.totalCustomersServed ?? day.TotalCustomersServed),
});

export const mapPeriodReport = (response: Raw): PeriodReport => ({
	commissionAmount: num(response.commissionAmount ?? response.CommissionAmount),
	countedDays: num(response.countedDays ?? response.CountedDays),
	days: ((response.days ?? response.Days ?? []) as Raw[]).map(mapDay),
	fixedDailyExpense: num(response.fixedDailyExpense ?? response.FixedDailyExpense),
	fixedExpenseTotal: num(response.fixedExpenseTotal ?? response.FixedExpenseTotal),
	from: String(response.from ?? response.From ?? ""),
	grossRevenue: num(response.grossRevenue ?? response.GrossRevenue),
	netProfit: num(response.netProfit ?? response.NetProfit),
	paymentMethodBreakdown: ((response.paymentMethodBreakdown ?? response.PaymentMethodBreakdown ?? []) as Raw[]).map(
		mapBreakdown,
	),
	periodType: (response.periodType ?? response.PeriodType) === "monthly" ? "monthly" : "weekly",
	to: String(response.to ?? response.To ?? ""),
	totalCustomersServed: num(response.totalCustomersServed ?? response.TotalCustomersServed),
});
