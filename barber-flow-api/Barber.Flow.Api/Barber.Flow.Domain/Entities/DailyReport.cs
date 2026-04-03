namespace Barber.Flow.Domain.Entities;

public class DailyReport
{
    public required DateOnly ReportDate { get; init; }

    public required int TotalCustomersServed { get; init; }

    public required decimal GrossRevenue { get; init; }

    public required decimal NetProfit { get; init; }

    public required decimal CommissionAmount { get; init; }

    public required decimal FixedDailyExpense { get; init; }

    public required IReadOnlyCollection<PaymentMethodBreakdown> PaymentMethodBreakdown { get; init; }

    public required IReadOnlyCollection<CompletedAppointmentReportItem> CompletedAppointments { get; init; }

    public required DateTime GeneratedAt { get; init; }
}

public class PaymentMethodBreakdown
{
    public required string PaymentMethod { get; init; }

    public required string Label { get; init; }

    public required decimal Total { get; init; }

    public required int AppointmentCount { get; init; }
}

public class CompletedAppointmentReportItem
{
    public required string Id { get; init; }

    public required string ClientName { get; init; }

    public string? ServiceName { get; init; }

    public required string Time { get; init; }

    public required decimal ServicePrice { get; init; }

    public required string PaymentMethodUsed { get; init; }
}