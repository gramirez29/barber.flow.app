using Barber.Flow.Domain.Entities;

namespace Barber.Flow.Domain.Interfaces;

public interface IRefreshTokenRepository
{
    Task SaveTokenAsync(RefreshToken token);
    Task<RefreshToken?> GetValidTokenAsync(string token);
    Task RevokeAsync(string tokenId);
}
