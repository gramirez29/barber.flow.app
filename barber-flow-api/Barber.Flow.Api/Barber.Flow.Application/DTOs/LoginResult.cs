namespace Barber.Flow.Infrastructure.Services.Auth.DTOs;

public record LoginResult
(
    string Username,
    string Token
);
