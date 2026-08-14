namespace Barber.Flow.Api.DTOs.Responses;

public record ClientResponse(
    string Id,
    string FirstName,
    string LastName,
    string Phone,
    string? Email,
    string? Address,
    DateTime? Birthday,
    string? Preferences,
    string? PaymentMethod,
    bool Active,
    string? PhotoUrl,
    string? ShopId,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
