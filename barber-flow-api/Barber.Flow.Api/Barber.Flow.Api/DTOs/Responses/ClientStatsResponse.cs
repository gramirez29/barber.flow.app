namespace Barber.Flow.Api.DTOs.Responses;

public record ClientStatsResponse(
    int TotalAppointments,
    int CompletedAppointments,
    int CancelledAppointments,
    decimal TotalSpent,
    string? LastVisit,
    string? PreferredPaymentMethod
);
