using Barber.Flow.Api.DTOs.Requests;
using Barber.Flow.Application.Services.Barbers;
using Barber.Flow.Application.Services.Users;

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

        return api;
    }

    private static async Task<IResult> GetAuthenticationUserAsync(AuthRequest req, IUserService userService)
    {
        var user = await userService.GetAuthenticationUserAsync(req.UserName, req.Password);
        return user == null ? TypedResults.BadRequest(new { message = "Invalid credentials" }) : TypedResults.Ok(user);
    }
}
