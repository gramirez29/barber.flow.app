using Barber.Flow.Api.DTOs.Requests;

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
    BarberSettingsDto? Settings,
    string? ShopId,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    Guid? UserId,
    bool? IsBlocked
);
