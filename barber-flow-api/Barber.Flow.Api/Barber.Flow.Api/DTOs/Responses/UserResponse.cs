namespace Barber.Flow.Api.DTOs.Responses;

public record UserResponse(
    Guid Id,
    string Name,
    string? Email,
    string UserName,
    string? Role,
    string? Token,
    string? RefreshToken,
    bool IsBlocked
);
