using Barber.Flow.Api.DTOs.Requests;
using Barber.Flow.Application.Services.Auth;

namespace Barber.Flow.Api.Apis;

public static class AuthApi
{
    public static RouteGroupBuilder MapAuthApi(this IEndpointRouteBuilder app)
    {
        var api = app.MapGroup("api/auth");

        api.MapPost("/login", GetJsonWebTokenAsync)
        .WithName(nameof(GetJsonWebTokenAsync))
        .WithTags("Authorization");

        return api;
    }

    public static async Task<IResult> GetJsonWebTokenAsync(LoginRequest request, IAuthService authService)
    {
        var result = await authService.GetJsonWebTokenAsync(request.UserOrEmail, request.Password);
        if (result == null) 
        {
            return TypedResults.BadRequest(new { message = "Invalid credentials" });
        }

        return TypedResults.Ok(result);
    }
}