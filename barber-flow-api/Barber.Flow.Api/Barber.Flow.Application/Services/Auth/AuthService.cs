using Barber.Flow.Domain.Interfaces;
using Barber.Flow.Infrastructure.Services.Auth.DTOs;

namespace Barber.Flow.Application.Services.Auth;

public class AuthService(IJwtAuthService jwtAuthService) : IAuthService
{
    public async Task<LoginResult?> GetJsonWebTokenAsync(string userOrEmail, string password, CancellationToken cancellationToken = default)
    {
        var jsonWebToken = await jwtAuthService.GetJsonWebTokenAsync(userOrEmail, password, cancellationToken);
        return jsonWebToken == null ? null : new LoginResult(jsonWebToken.Username, jsonWebToken.Token);
    }
}
