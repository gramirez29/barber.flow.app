namespace Barber.Flow.Api.DTOs.Requests;

public record LoginRequest
(
    string UserOrEmail,
    string Password
);
