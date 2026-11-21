namespace Barber.Flow.Api.DTOs.Responses;

/// <summary>
/// Weekly or monthly report. Same figures as <see cref="DailyReportResponse"/> for the whole period,
/// plus <see cref="Days"/> (one entry per day, including days without sales).
/// </summary>
public record PeriodReportResponse(
    string PeriodType,
    DateOnly From,
    DateOnly To,
    int CountedDays,
    int TotalCustomersServed,
    decimal GrossRevenue,
    decimal CommissionAmount,
    decimal FixedDailyExpense,
    decimal FixedExpenseTotal,
    decimal NetProfit,
    IEnumerable<PaymentMethodBreakdownResponse> PaymentMethodBreakdown,
    IEnumerable<PeriodReportDayResponse> Days,
    DateTime GeneratedAt);

public record PeriodReportDayResponse(
    DateOnly Date,
    int TotalCustomersServed,
    decimal GrossRevenue,
    decimal CommissionAmount,
    decimal FixedExpense,
    decimal NetProfit);
