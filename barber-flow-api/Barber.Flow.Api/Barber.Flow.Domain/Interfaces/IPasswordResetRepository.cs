using Barber.Flow.Domain.Entities;

namespace Barber.Flow.Domain.Interfaces;

public interface IPasswordResetRepository
{
    Task SaveTokenAsync(PasswordResetToken token);
    Task<PasswordResetToken?> GetValidTokenAsync(string userId, string otpCode);
    Task MarkAsUsedAsync(string tokenId);
    Task InvalidateAllForUserAsync(string userId);
}