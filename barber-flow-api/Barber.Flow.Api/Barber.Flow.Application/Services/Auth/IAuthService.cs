namespace Barber.Flow.Application.Services.Auth;

public interface IAuthService
{
    Task<bool> RequestPasswordResetAsync(string email, CancellationToken cancellationToken = default);
    Task<bool> VerifyOtpAsync(string email, string otpCode, CancellationToken cancellationToken = default);
    Task<bool> ResetPasswordAsync(string email, string otpCode, string newPassword, CancellationToken cancellationToken = default);

    // Best-effort: failures are logged, never thrown, since a barber account is already
    // created by the time this runs and a missing welcome email shouldn't roll that back.
    Task SendWelcomeEmailAsync(string email, string barberName, string userName, string temporaryPassword, CancellationToken cancellationToken = default);
}
