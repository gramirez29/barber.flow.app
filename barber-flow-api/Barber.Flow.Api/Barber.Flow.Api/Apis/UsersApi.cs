using Barber.Flow.Api.DTOs.Requests;
using Barber.Flow.Api.DTOs.Responses;
using Barber.Flow.Application.Services.Users;
using Microsoft.AspNetCore.Http;
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
            .WithTags(UsersTag);

        api.MapPost("/refresh", RefreshTokenAsync)
            .WithName(nameof(RefreshTokenAsync))
            .WithTags(UsersTag);

        api.MapDelete("/me", DeleteSelfAsync)
            .WithName(nameof(DeleteSelfAsync))
            .WithTags(UsersTag)
            .RequireAuthorization();

        return api;
    }

    private static async Task<IResult> GetAuthenticationUserAsync(AuthRequest req, IUserService userService)
    {
        var user = await userService.GetAuthenticationUserAsync(req.UserName, req.Password);
        if (user == null)
            return TypedResults.BadRequest(new { message = "Invalid credentials" });

        var response = new UserResponse(user.Id, user.Name, user.Email, user.UserName, user.Role, user.Token, user.RefreshToken);
        return TypedResults.Ok(response);
    }

    private static async Task<IResult> RefreshTokenAsync(RefreshTokenRequest req, IUserService userService)
    {
        var user = await userService.RefreshAsync(req.RefreshToken);
        if (user == null)
            return TypedResults.Unauthorized();

        var response = new UserResponse(user.Id, user.Name, user.Email, user.UserName, user.Role, user.Token, user.RefreshToken);
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

        // El token emite tanto "sub" (username) como "nameid" (Guid del usuario), y ambos
        // se remapean por defecto a ClaimTypes.NameIdentifier al validar el JWT, así que
        // terminan coexistiendo dos claims con ese mismo tipo — hay que quedarse con el
        // valor que realmente sea un Guid, no simplemente el primero (FindFirst).
        var userId = context.User.Claims
            .Where(c => c.Type == ClaimTypes.NameIdentifier || c.Type == JwtRegisteredClaimNames.NameId)
            .Select(c => c.Value)
            .FirstOrDefault(value => Guid.TryParse(value, out _));
        if (string.IsNullOrWhiteSpace(userId))
            return TypedResults.Unauthorized();

        var deleted = await userService.DeleteAsync(userId, cancellationToken);
        return deleted ? TypedResults.NoContent() : TypedResults.NotFound();
    }
}
