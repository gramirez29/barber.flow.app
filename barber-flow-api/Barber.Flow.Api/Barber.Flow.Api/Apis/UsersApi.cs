using Barber.Flow.Application.Services.Barbers;
using Barber.Flow.Application.Services.Users;

namespace Barber.Flow.Api.Apis;

public static class UsersApi
{
    private static readonly string UsersTag = "Users";

    public static RouteGroupBuilder MapUsersApi(this IEndpointRouteBuilder app)
    {
        var api = app.MapGroup("api/users");

        api.MapGet("/authentication/{userName}", GetAuthenticationUserAsync)
            .WithName(nameof(GetAuthenticationUserAsync))
            .WithTags(UsersTag);

        return api;
    }

    private static async Task<IResult> GetAuthenticationUserAsync(string userName, string password, IUserService userService)
    {
        var user = await userService.GetAuthenticationUserAsync(userName, password);
        return user == null ? TypedResults.NotFound() : TypedResults.Ok(user);
    }
}
