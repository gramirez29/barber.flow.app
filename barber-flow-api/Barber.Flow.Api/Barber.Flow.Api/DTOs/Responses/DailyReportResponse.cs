namespace Barber.Flow.Api.DTOs.Responses;

public record DailyReportResponse(
    DateOnly ReportDate,
    int TotalCustomersServed,
    decimal GrossRevenue,
    decimal NetProfit,
    decimal CommissionAmount,
    decimal FixedDailyExpense,
    IEnumerable<PaymentMethodBreakdownResponse> PaymentMethodBreakdown,
    IEnumerable<CompletedAppointmentReportItemResponse> CompletedAppointments,
    DateTime GeneratedAt);

public record PaymentMethodBreakdownResponse(
    string PaymentMethod,
    string Label,
    decimal Total,
    int AppointmentCount);

public record CompletedAppointmentReportItemResponse(
    string Id,
    string ClientName,
    string? ServiceName,
    string Time,
    decimal ServicePrice,
    string PaymentMethodUsed);