using Barber.Flow.Infrastructure.Services.Auth.DTOs;

namespace Barber.Flow.Application.Services.Auth;

public interface IAuthService
{
    Task<LoginResult?> GetJsonWebTokenAsync(string userOrEmail, string password, CancellationToken cancellationToken = default);
    Task<bool> RequestPasswordResetAsync(string email, CancellationToken cancellationToken = default);
    Task<bool> VerifyOtpAsync(string email, string otpCode, CancellationToken cancellationToken = default);
    Task<bool> ResetPasswordAsync(string email, string otpCode, string newPassword, CancellationToken cancellationToken = default);
}
