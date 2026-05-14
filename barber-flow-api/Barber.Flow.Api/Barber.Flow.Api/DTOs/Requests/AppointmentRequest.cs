namespace Barber.Flow.Api.DTOs.Requests;

public record AppointmentRequest(
    string ClientName,
    string Phone,
    string Date,
    string Time,
    string Status,
    DateTime? CompletedAt,
    string? PaymentMethodUsed,
    string? ServiceName,
    decimal? ServicePrice,
    string? Notes
);
