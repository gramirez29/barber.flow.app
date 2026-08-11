using Barber.Flow.Domain.Entities;
using Barber.Flow.Domain.Interfaces;
using Microsoft.Extensions.Logging;
using System.Security.Cryptography;

namespace Barber.Flow.Application.Services.Auth;

public class AuthService(
    IUserRepository userRepository,
    IPasswordResetRepository passwordResetRepository,
    IEmailService emailService,
    ILogger<AuthService> logger) : IAuthService
{
    public async Task<bool> RequestPasswordResetAsync(string email, CancellationToken cancellationToken = default)
    {
        var user = await userRepository.GetByEmailAsync(email, cancellationToken);
        if (user == null) return false;

        // Invalidate previous tokens
        await passwordResetRepository.InvalidateAllForUserAsync(user.Id.ToString());

        // Generate 6-digit OTP using a cryptographically secure generator (predictable OTPs are brute-forceable)
        var otp = RandomNumberGenerator.GetInt32(100000, 999999).ToString();

        var token = new PasswordResetToken
        {
            UserId = user.Id.ToString(),
            OtpCode = otp,
            ExpiresAt = DateTime.UtcNow.AddMinutes(15)
        };

        await passwordResetRepository.SaveTokenAsync(token);

        // Send Email with OTP
        var subject = "Barber Flow - Código de recuperación de contraseña";
        var body = GetEmailTemplate(user.Name, otp);

        try
        {
            await emailService.SendEmailAsync(email, subject, body, true);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send password reset email to {Email}", email);
            await passwordResetRepository.InvalidateAllForUserAsync(user.Id.ToString());
            return false;
        }

        return true;
    }

    private string GetEmailTemplate(string userName, string otp)
    {
        return $@"
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; background-color: #1A1A1A; color: white;'>
                <div style='text-align: center; margin-bottom: 20px;'>
                    <h1 style='color: #C9A84C;'>BARBER FLOW</h1>
                </div>
                <h2>Hola {userName},</h2>
                <p>Recibimos una solicitud para restablecer tu contraseña. Utiliza el siguiente código de 6 dígitos para completar el proceso:</p>
                <div style='text-align: center; margin: 30px 0;'>
                    <span style='font-size: 32px; font-weight: bold; letter-spacing: 5px; background-color: #C9A84C; color: #1A1A1A; padding: 10px 20px; border-radius: 5px;'>{otp}</span>
                </div>
                <p>Este código vencerá en 15 minutos.</p>
                <p>Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
                <hr style='border: 0; border-top: 1px solid #C9A84C; margin: 20px 0;'>
                <p style='font-size: 12px; color: #aaa; text-align: center;'>© 2024 Barber Flow. Premium Grooming Experience.</p>
            </div>";
    }

    public async Task<bool> VerifyOtpAsync(string email, string otpCode, CancellationToken cancellationToken = default)
    {
        var user = await userRepository.GetByEmailAsync(email, cancellationToken);
        if (user == null) return false;

        var token = await passwordResetRepository.GetValidTokenAsync(user.Id.ToString(), otpCode);
        return token != null;
    }

    public async Task<bool> ResetPasswordAsync(string email, string otpCode, string newPassword, CancellationToken cancellationToken = default)
    {
        var user = await userRepository.GetByEmailAsync(email, cancellationToken);
        if (user == null) return false;

        var token = await passwordResetRepository.GetValidTokenAsync(user.Id.ToString(), otpCode);
        if (token == null) return false;

        // Update password
        var success = await userRepository.UpdatePasswordAsync(user.UserName, newPassword, cancellationToken);
        if (success)
        {
            await passwordResetRepository.MarkAsUsedAsync(token.Id);
        }

        return success;
    }
}
