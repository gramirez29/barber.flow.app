using Barber.Flow.Domain.Entities;
using Barber.Flow.Domain.Interfaces;

namespace Barber.Flow.Infrastructure.Services.Auth;

public class InMemoryRefreshTokenRepository : IRefreshTokenRepository
{
    private static readonly List<RefreshToken> _tokens = new();

    public Task SaveTokenAsync(RefreshToken token)
    {
        _tokens.Add(token);
        return Task.CompletedTask;
    }

    public Task<RefreshToken?> GetValidTokenAsync(string token)
    {
        var found = _tokens.FirstOrDefault(t => t.Token == token && t.IsValid());
        return Task.FromResult(found);
    }

    public Task RevokeAsync(string tokenId)
    {
        var token = _tokens.FirstOrDefault(t => t.Id == tokenId);
        if (token != null)
        {
            token.IsRevoked = true;
        }
        return Task.CompletedTask;
    }
}
