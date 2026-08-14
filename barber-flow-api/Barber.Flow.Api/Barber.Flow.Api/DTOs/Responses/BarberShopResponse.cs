namespace Barber.Flow.Api.DTOs.Responses;

public record BarberShopResponse(
    string Id,
    string Name,
    string? Phone,
    string? Address,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
