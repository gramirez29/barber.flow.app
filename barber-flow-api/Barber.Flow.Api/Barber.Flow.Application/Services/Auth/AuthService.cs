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
        var subject = "HairCutsFlow CR - Código de recuperación de contraseña";
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

    public async Task SendWelcomeEmailAsync(string email, string barberName, string userName, string temporaryPassword, CancellationToken cancellationToken = default)
    {
        var subject = "Bienvenido a HairCutsFlow CR - Tu cuenta ha sido creada";
        var body = GetWelcomeEmailTemplate(barberName, userName, temporaryPassword);

        try
        {
            await emailService.SendEmailAsync(email, subject, body, true);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send welcome email to {Email}", email);
        }
    }

    private string GetWelcomeEmailTemplate(string barberName, string userName, string temporaryPassword)
    {
        return $@"
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; background-color: #1A1A1A; color: white;'>
                <div style='text-align: center; margin-bottom: 20px;'>
                    <h1 style='color: #C9A84C;'>HairCutsFlow CR</h1>
                </div>
                <h2>Hola {barberName},</h2>
                <p>Se creó tu cuenta en HairCutsFlow, la plataforma para gestionar tu barbería: citas, clientes, reportes y notificaciones en un único espacio.</p>
                <p>Estas son tus credenciales de acceso iniciales:</p>
                <div style='text-align: center; margin: 30px 0;'>
                    <table style='margin: 0 auto; text-align: left;'>
                        <tr>
                            <td style='padding: 8px 16px; color: #aaa;'>Usuario:</td>
                            <td style='padding: 8px 16px; font-weight: bold; color: white;'>{userName}</td>
                        </tr>
                        <tr>
                            <td style='padding: 8px 16px; color: #aaa;'>Contraseña temporal:</td>
                            <td style='padding: 8px 16px;'><span style='font-size: 18px; font-weight: bold; letter-spacing: 2px; background-color: #C9A84C; color: #1A1A1A; padding: 6px 14px; border-radius: 5px;'>{temporaryPassword}</span></td>
                        </tr>
                    </table>
                </div>
                <p>Puedes usa la contraseña que te proporcionamos pero por seguridad, te recomendamos cambiar esta contraseña temporal por una propia lo antes posible.</p>
                <div style='text-align: center; margin: 30px 0;'>
                    <a href='https://app.haircutsflowcr.com/forgot-password' style='display: inline-block; background-color: #C9A84C; color: #1A1A1A; font-weight: bold; text-decoration: none; padding: 12px 28px; border-radius: 6px;'>Cambiar mi contraseña</a>
                </div>
                <p>Ese enlace te llevará al flujo de recuperación de contraseña, donde recibirás un código de verificación en este mismo correo para completar el cambio.</p>
                <p>Si no esperabas este correo, contactá al administrador de tu barbería.</p>
                <hr style='border: 0; border-top: 1px solid #C9A84C; margin: 20px 0;'>
                <p style='font-size: 12px; color: #aaa; text-align: center;'>
                    © {DateTime.UtcNow.Year} HairCutsFlow CR. Premium Grooming Experience.<br>
                    <a href='https://www.haircutsflowcr.com' style='color: #C9A84C; text-decoration: none;'>www.haircutsflowcr.com</a>
                </p>
            </div>";
    }

    private string GetEmailTemplate(string userName, string otp)
    {
        return $@"
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; background-color: #1A1A1A; color: white;'>
                <div style='text-align: center; margin-bottom: 20px;'>
                    <h1 style='color: #C9A84C;'>HAIRCUTSFLOW CR</h1>
                </div>
                <h2>Hola {userName},</h2>
                <p>Recibimos una solicitud para restablecer tu contraseña. Utiliza el siguiente código de 6 dígitos para completar el proceso:</p>
                <div style='text-align: center; margin: 30px 0;'>
                    <span style='font-size: 32px; font-weight: bold; letter-spacing: 5px; background-color: #C9A84C; color: #1A1A1A; padding: 10px 20px; border-radius: 5px;'>{otp}</span>
                </div>
                <p>Este código vencerá en 15 minutos.</p>
                <p>Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
                <hr style='border: 0; border-top: 1px solid #C9A84C; margin: 20px 0;'>
                <p style='font-size: 12px; color: #aaa; text-align: center;'>
                    © {DateTime.UtcNow.Year} HairCutsFlow CR. Premium Grooming Experience.<br>
                    <a href='https://www.haircutsflowcr.com' style='color: #C9A84C; text-decoration: none;'>www.haircutsflowcr.com</a>
                </p>
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
