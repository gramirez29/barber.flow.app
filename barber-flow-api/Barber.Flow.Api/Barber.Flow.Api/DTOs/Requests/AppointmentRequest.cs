namespace Barber.Flow.Api.DTOs.Requests;

public record AppointmentRequest(
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
    // 15..120, multiples of 15. Omit to keep the stored value (update) or use 30 (create). Ignored unless the barber has the feature enabled.
    int? DurationMinutes = null
);
