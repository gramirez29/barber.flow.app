namespace Barber.Flow.Application.Services.Auth;

public interface IAuthService
{
    Task<bool> RequestPasswordResetAsync(string email, CancellationToken cancellationToken = default);
    Task<bool> VerifyOtpAsync(string email, string otpCode, CancellationToken cancellationToken = default);
    Task<bool> ResetPasswordAsync(string email, string otpCode, string newPassword, CancellationToken cancellationToken = default);
}
