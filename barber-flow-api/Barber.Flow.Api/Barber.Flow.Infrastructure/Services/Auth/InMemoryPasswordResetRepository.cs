using Barber.Flow.Domain.Entities;
using Barber.Flow.Domain.Interfaces;

namespace Barber.Flow.Infrastructure.Services.Auth;

public class InMemoryPasswordResetRepository : IPasswordResetRepository
{
    private static readonly List<PasswordResetToken> _tokens = new();

    public Task SaveTokenAsync(PasswordResetToken token)
    {
        _tokens.Add(token);
        return Task.CompletedTask;
    }

    public Task<PasswordResetToken?> GetValidTokenAsync(string userId, string otpCode)
    {
        var token = _tokens.FirstOrDefault(t => 
            t.UserId == userId && 
            t.OtpCode == otpCode && 
            t.IsValid());
        
        return Task.FromResult(token);
    }

    public Task MarkAsUsedAsync(string tokenId)
    {
        var token = _tokens.FirstOrDefault(t => t.Id == tokenId);
        if (token != null)
        {
            token.IsUsed = true;
        }
        return Task.CompletedTask;
    }

    public Task InvalidateAllForUserAsync(string userId)
    {
        var userTokens = _tokens.Where(t => t.UserId == userId);
        foreach (var token in userTokens)
        {
            token.IsUsed = true;
        }
        return Task.CompletedTask;
    }
}