using System.Net;
using System.Net.Http.Json;
using Barber.Flow.Api.DTOs.Requests;

namespace Barber.Flow.Api.Tests.Apis;

public class AuthApiTests : IClassFixture<ApiWebApplicationFactory>
{
    private readonly HttpClient _client;

    public AuthApiTests(ApiWebApplicationFactory factory) => _client = factory.CreateClient();

    [Fact]
    public async Task ForgotPassword_UnknownEmail_ReturnsOkWithoutRevealingAccountExistence()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/forgot-password", new ForgotPasswordRequest("no-such-user@example.com"));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
