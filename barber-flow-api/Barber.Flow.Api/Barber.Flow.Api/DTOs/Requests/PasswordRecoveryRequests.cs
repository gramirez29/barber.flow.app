namespace Barber.Flow.Api.DTOs.Requests;

public record ForgotPasswordRequest(string Email);

public record VerifyOtpRequest(string Email, string OtpCode);

public record ResetPasswordRequest(string Email, string OtpCode, string NewPassword);