using Barber.Flow.Domain.Entities;
using Barber.Flow.Domain.Interfaces;

namespace Barber.Flow.Infrastructure.Services.Auth;

public class InMemoryRefreshTokenRepository : IRefreshTokenRepository
{
    private static readonly List<RefreshToken> _tokens = new();

    public Task SaveTokenAsync(RefreshToken token)
    {
        // Persist a hashed copy so the raw token never lands in the store - the caller keeps
        // holding the raw value (e.g. UserService returns it to the client), only storage is hashed.
        _tokens.Add(new RefreshToken
        {
            Id = token.Id,
            UserId = token.UserId,
            Token = RefreshTokenHasher.Hash(token.Token),
            ExpiresAt = token.ExpiresAt,
            CreatedAt = token.CreatedAt,
            IsRevoked = token.IsRevoked,
        });
        return Task.CompletedTask;
    }

    public Task<RefreshToken?> GetValidTokenAsync(string token)
    {
        var hashed = RefreshTokenHasher.Hash(token);
        var found = _tokens.FirstOrDefault(t => t.Token == hashed && t.IsValid());
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
