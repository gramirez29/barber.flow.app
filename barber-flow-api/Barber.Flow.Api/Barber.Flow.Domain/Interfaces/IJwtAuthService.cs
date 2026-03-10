using Barber.Flow.Domain.ValueObjects;

namespace Barber.Flow.Domain.Interfaces;

public interface IJwtAuthService
{
    Task<AuthResult?> GetJsonWebTokenAsync(string userOrEmail, string password, CancellationToken cancellationToken = default);
}
