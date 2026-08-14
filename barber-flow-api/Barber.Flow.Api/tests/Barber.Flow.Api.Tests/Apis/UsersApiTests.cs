using System.Net;
using System.Net.Http.Json;
using Barber.Flow.Api.DTOs.Requests;
using Barber.Flow.Api.DTOs.Responses;

namespace Barber.Flow.Api.Tests.Apis;

public class UsersApiTests : IClassFixture<ApiWebApplicationFactory>
{
    private readonly HttpClient _client;

    public UsersApiTests(ApiWebApplicationFactory factory) => _client = factory.CreateClient();

    [Fact]
    public async Task Authentication_ValidCredentials_ReturnsOkWithToken()
    {
        var response = await _client.PostAsJsonAsync("/api/users/authentication", new AuthRequest { UserName = "admin", Password = "password" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<UserResponse>();
        Assert.NotNull(body);
        Assert.False(string.IsNullOrWhiteSpace(body!.Token));
    }

    [Fact]
    public async Task Authentication_InvalidCredentials_ReturnsBadRequest()
    {
        var response = await _client.PostAsJsonAsync("/api/users/authentication", new AuthRequest { UserName = "admin", Password = "wrong-password" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task DeleteSelf_WithoutToken_ReturnsUnauthorized()
    {
        var response = await _client.DeleteAsync("/api/users/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
