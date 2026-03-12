namespace Barber.Flow.Api.DTOs.Responses;

public record BarberResponse(
    string Id,
    string UserName,
    string UserPhone,
    string UserEmail,
    string BarberName,
    string BarberPhone,
    string? Address,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
