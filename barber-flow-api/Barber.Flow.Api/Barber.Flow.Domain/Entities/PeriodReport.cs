namespace Barber.Flow.Domain.Entities;

/// <summary>
/// Weekly or monthly closing report. Same figures as <see cref="DailyReport"/> for the whole period,
/// plus one entry per day so a client can show the breakdown.
/// </summary>
public class PeriodReport
{
    public const string Weekly = "weekly";

    public const string Monthly = "monthly";

    /// <summary><see cref="Weekly"/> or <see cref="Monthly"/>.</summary>
    public required string PeriodType { get; init; }

    public required DateOnly From { get; init; }

    public required DateOnly To { get; init; }

    /// <summary>
    /// Days of the period the fixed daily expense was charged for: every day, except that a period still
    /// in progress only counts up to today (future days haven't happened yet).
    /// </summary>
    public required int CountedDays { get; init; }

    public required int TotalCustomersServed { get; init; }

    public required decimal GrossRevenue { get; init; }

    /// <summary>Sum of the per-day commissions, each rounded like the daily report does.</summary>
    public required decimal CommissionAmount { get; init; }

    /// <summary>The configured expense for ONE day.</summary>
    public required decimal FixedDailyExpense { get; init; }

    /// <summary><see cref="FixedDailyExpense"/> × <see cref="CountedDays"/>.</summary>
    public required decimal FixedExpenseTotal { get; init; }

    public required decimal NetProfit { get; init; }

    public required IReadOnlyCollection<PaymentMethodBreakdown> PaymentMethodBreakdown { get; init; }

    /// <summary>Every day of the period in date order, including days without sales.</summary>
    public required IReadOnlyCollection<PeriodReportDay> Days { get; init; }

    public required DateTime GeneratedAt { get; init; }
}

public class PeriodReportDay
{
    public required DateOnly Date { get; init; }

    public required int TotalCustomersServed { get; init; }

    public required decimal GrossRevenue { get; init; }

    public required decimal CommissionAmount { get; init; }

    /// <summary>The fixed expense charged to this day (0 for a day that hasn't happened yet).</summary>
    public required decimal FixedExpense { get; init; }

    public required decimal NetProfit { get; init; }
}
