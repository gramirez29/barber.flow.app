using Barber.Flow.Infrastructure.Services.Auth.DTOs;

namespace Barber.Flow.Application.Services.Auth;

public interface IAuthService
{
    Task<LoginResult?> GetJsonWebTokenAsync(string userOrEmail, string password, CancellationToken cancellationToken = default);
}
