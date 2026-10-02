namespace Barber.Flow.Api.DTOs.Responses;

public record AppointmentResponse(
    string Id,
    string ClientName,
    string Phone,
    string? ClientId,
    string Date,
    string Time,
    string Status,
    DateTime? CompletedAt,
    string? PaymentMethodUsed,
    string? ServiceName,
    decimal? ServicePrice,
    string? Notes,
    string? ShopId,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    string CreatedBy,
    string UpdatedBy,
    string? SeriesId = null,
    // Effective length in minutes (stored value, 30 when none). Clients ignore it when the barber has the feature off.
    int DurationMinutes = 30
);
