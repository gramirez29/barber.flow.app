using System.Net;
using System.Net.Http.Json;
using Barber.Flow.Api.DTOs.Requests;

namespace Barber.Flow.Api.Tests.Apis;

public class AuthApiTests : IClassFixture<ApiWebApplicationFactory>
{
    private readonly HttpClient _client;

    public AuthApiTests(ApiWebApplicationFactory factory) => _client = factory.CreateClient();

    [Fact]
    public async Task Login_ValidHardcodedAdminCredentials_ReturnsOk()
    {
        // AuthApi's /login still goes through the hardcoded admin/password check in
        // JwtAuthService (marked TODO in source) - not the real IUserRepository-backed path
        // that /api/users/authentication uses. Documented in claude.md.
        var response = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest("admin", "password"));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Login_InvalidCredentials_ReturnsBadRequest()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest("admin", "wrong-password"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task ForgotPassword_UnknownEmail_ReturnsBadRequest()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/forgot-password", new ForgotPasswordRequest("no-such-user@example.com"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
