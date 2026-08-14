namespace Barber.Flow.Api.DTOs.Requests;

public record BarberShopRequest(
    string Name,
    string? Phone,
    string? Address
);
