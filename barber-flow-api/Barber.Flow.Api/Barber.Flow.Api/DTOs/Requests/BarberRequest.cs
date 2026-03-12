namespace Barber.Flow.Api.DTOs.Requests;

public record BarberRequest(
    string UserName,
    string UserPhone,
    string UserEmail,
    string BarberName,
    string BarberPhone,
    string? Address
);
