using Barber.Flow.Api.DTOs.Requests;
using Barber.Flow.Application.Services.Auth;
using Microsoft.AspNetCore.RateLimiting;

namespace Barber.Flow.Api.Apis;

public static class AuthApi
{
    public static RouteGroupBuilder MapAuthApi(this IEndpointRouteBuilder app)
    {
        var api = app.MapGroup("api/auth")
            .RequireRateLimiting("auth");

        api.MapPost("/forgot-password", ForgotPasswordAsync)
        .WithName(nameof(ForgotPasswordAsync))
        .WithTags("Authorization");

        api.MapPost("/verify-otp", VerifyOtpAsync)
        .WithName(nameof(VerifyOtpAsync))
        .WithTags("Authorization");

        api.MapPost("/reset-password", ResetPasswordAsync)
        .WithName(nameof(ResetPasswordAsync))
        .WithTags("Authorization");

        return api;
    }

    public static async Task<IResult> ForgotPasswordAsync(ForgotPasswordRequest request, IAuthService authService)
    {
        // Always respond 200 with the same generic message, whether the email is registered or
        // not (and even if the send fails) - branching the status code on the result would let an
        // attacker enumerate registered accounts by watching for 200 vs 400.
        await authService.RequestPasswordResetAsync(request.Email);
        return TypedResults.Ok(new { message = "OTP sent if account exists" });
    }

    public static async Task<IResult> VerifyOtpAsync(VerifyOtpRequest request, IAuthService authService)
    {
        var result = await authService.VerifyOtpAsync(request.Email, request.OtpCode);
        return result ? TypedResults.Ok(new { message = "OTP verified" }) : TypedResults.BadRequest(new { message = "Invalid or expired OTP" });
    }

    public static async Task<IResult> ResetPasswordAsync(ResetPasswordRequest request, IAuthService authService)
    {
        var result = await authService.ResetPasswordAsync(request.Email, request.OtpCode, request.NewPassword);
        return result ? TypedResults.Ok(new { message = "Password reset successful" }) : TypedResults.BadRequest(new { message = "Error resetting password" });
    }
}