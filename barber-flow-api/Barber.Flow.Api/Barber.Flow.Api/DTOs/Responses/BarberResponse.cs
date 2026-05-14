namespace Barber.Flow.Api.DTOs.Responses;

public record BarberResponse(
    string Id,
    string UserName,
    string UserPhone,
    string UserEmail,
    string BarberName,
    string BarberPhone,
    string? Address,
    string? BarberShopName,
    string? BarberShopPhone,
    string? PhotoUrl,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
