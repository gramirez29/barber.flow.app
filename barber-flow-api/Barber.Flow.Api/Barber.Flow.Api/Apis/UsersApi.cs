using Barber.Flow.Api.DTOs.Requests;
using Barber.Flow.Api.DTOs.Responses;
using Barber.Flow.Application.Services.Users;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.RateLimiting;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;

namespace Barber.Flow.Api.Apis;

public static class UsersApi
{
    private static readonly string UsersTag = "Users";

    public static RouteGroupBuilder MapUsersApi(this IEndpointRouteBuilder app)
    {
        var api = app.MapGroup("api/users");

        api.MapPost("/authentication", GetAuthenticationUserAsync)
            .WithName(nameof(GetAuthenticationUserAsync))
            .WithTags(UsersTag)
            .RequireRateLimiting("auth");

        api.MapPost("/refresh", RefreshTokenAsync)
            .WithName(nameof(RefreshTokenAsync))
            .WithTags(UsersTag);

        api.MapDelete("/me", DeleteSelfAsync)
            .WithName(nameof(DeleteSelfAsync))
            .WithTags(UsersTag)
            .RequireAuthorization();

        api.MapGet("/me/status", GetMyStatusAsync)
            .WithName(nameof(GetMyStatusAsync))
            .WithTags(UsersTag)
            .RequireAuthorization();

        api.MapPatch("/{id}/block", SetBlockedAsync)
            .WithName(nameof(SetBlockedAsync))
            .WithTags(UsersTag)
            .RequireAuthorization();

        return api;
    }

    private static async Task<IResult> GetAuthenticationUserAsync(AuthRequest req, IUserService userService)
    {
        var user = await userService.GetAuthenticationUserAsync(req.UserName, req.Password);
        if (user == null)
            return TypedResults.BadRequest(new { message = "Invalid credentials" });

        var response = new UserResponse(user.Id, user.Name, user.Email, user.UserName, user.Role, user.Token, user.RefreshToken, user.IsBlocked);
        return TypedResults.Ok(response);
    }

    private static async Task<IResult> RefreshTokenAsync(RefreshTokenRequest req, IUserService userService)
    {
        var user = await userService.RefreshAsync(req.RefreshToken);
        if (user == null)
            return TypedResults.Unauthorized();

        var response = new UserResponse(user.Id, user.Name, user.Email, user.UserName, user.Role, user.Token, user.RefreshToken, user.IsBlocked);
        return TypedResults.Ok(response);
    }

    private static async Task<IResult> DeleteSelfAsync(
        HttpContext context,
        IUserService userService,
        CancellationToken cancellationToken)
    {
        var role = context.User.FindFirst(ClaimTypes.Role)?.Value;
        if (string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase))
            return TypedResults.Forbid();

        var userId = GetAuthenticatedUserId(context);
        if (string.IsNullOrWhiteSpace(userId))
            return TypedResults.Unauthorized();

        var deleted = await userService.DeleteAsync(userId, cancellationToken);
        return deleted ? TypedResults.NoContent() : TypedResults.NotFound();
    }

    private static async Task<IResult> GetMyStatusAsync(
        HttpContext context,
        IUserService userService,
        CancellationToken cancellationToken)
    {
        var userId = GetAuthenticatedUserId(context);
        if (string.IsNullOrWhiteSpace(userId) || !Guid.TryParse(userId, out var guid))
            return TypedResults.Unauthorized();

        var user = await userService.GetByIdAsync(guid, cancellationToken);
        if (user == null) return TypedResults.NotFound();

        return TypedResults.Ok(new AppStatusResponse(user.IsBlocked));
    }

    private static async Task<IResult> SetBlockedAsync(
        string id,
        SetBlockedRequest request,
        HttpContext httpContext,
        IUserService userService,
        CancellationToken cancellationToken)
    {
        var callerUserName = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? httpContext.User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? httpContext.User.FindFirst("username")?.Value
            ?? httpContext.User.Identity?.Name;
        var config = httpContext.RequestServices.GetRequiredService<IConfiguration>();
        var adminUser = config["BARBERFLOW_ADMIN_USERNAME"] ?? config["AdminUsername"] ?? "admin";
        if (!string.Equals(callerUserName, adminUser, StringComparison.OrdinalIgnoreCase))
        {
            return TypedResults.StatusCode(StatusCodes.Status403Forbidden);
        }

        var result = await userService.SetBlockedAsync(id, request.IsBlocked, callerUserName ?? adminUser, cancellationToken);
        if (result == null)
            return TypedResults.BadRequest(new { message = "La cuenta de administrador no puede bloquearse." });
        if (result == false)
            return TypedResults.NotFound();

        return TypedResults.Ok(new SetBlockedResponse(id, request.IsBlocked));
    }

    // El token emite tanto "sub" (username) como "nameid" (Guid del usuario), y ambos se
    // remapean por defecto a ClaimTypes.NameIdentifier al validar el JWT, así que terminan
    // coexistiendo dos claims con ese mismo tipo — hay que quedarse con el valor que
    // realmente sea un Guid, no simplemente el primero (FindFirst).
    private static string? GetAuthenticatedUserId(HttpContext context)
    {
        return context.User.Claims
            .Where(c => c.Type == ClaimTypes.NameIdentifier || c.Type == JwtRegisteredClaimNames.NameId)
            .Select(c => c.Value)
            .FirstOrDefault(value => Guid.TryParse(value, out _));
    }
}
