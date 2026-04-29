namespace Barber.Flow.Api.DTOs.Responses;

public record AppointmentResponse(
    string Id,
    string ClientName,
    string Phone,
    string Date,
    string Time,
    string Status,
    DateTime? CompletedAt,
    string? PaymentMethodUsed,
    string? ServiceName,
    decimal? ServicePrice,
    string? Notes,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    string CreatedBy,
    string UpdatedBy
);
