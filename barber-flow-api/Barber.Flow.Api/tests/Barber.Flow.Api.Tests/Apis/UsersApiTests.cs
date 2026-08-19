using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Barber.Flow.Api.DTOs.Requests;
using Barber.Flow.Api.DTOs.Responses;

namespace Barber.Flow.Api.Tests.Apis;

public class UsersApiTests : IClassFixture<ApiWebApplicationFactory>
{
    private readonly ApiWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public UsersApiTests(ApiWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private async Task<(HttpClient client, UserResponse user)> LoginAsync(string userName, string password)
    {
        var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/users/authentication", new AuthRequest { UserName = userName, Password = password });
        var user = await response.Content.ReadFromJsonAsync<UserResponse>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", user!.Token);
        return (client, user);
    }

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

    [Fact]
    public async Task MyStatus_NotBlocked_ReturnsFalse()
    {
        var (client, _) = await LoginAsync("admin", "password");

        var response = await client.GetAsync("/api/users/me/status");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<AppStatusResponse>();
        Assert.NotNull(body);
        Assert.False(body!.IsBlocked);
    }

    [Fact]
    public async Task SetBlocked_AsNonAdminCaller_ReturnsForbidden()
    {
        var (client, barber) = await LoginAsync("barber", "barber");

        var response = await client.PatchAsJsonAsync($"/api/users/{barber.Id}/block", new SetBlockedRequest(true));

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task SetBlocked_TargetIsAdminAccount_ReturnsBadRequest()
    {
        var (adminClient, admin) = await LoginAsync("admin", "password");

        var response = await adminClient.PatchAsJsonAsync($"/api/users/{admin.Id}/block", new SetBlockedRequest(true));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task SetBlocked_ThenUnblocked_TogglesAccessForTarget()
    {
        var (adminClient, _) = await LoginAsync("admin", "password");
        var (barberClient, barber) = await LoginAsync("barber", "barber");

        var blockResponse = await adminClient.PatchAsJsonAsync($"/api/users/{barber.Id}/block", new SetBlockedRequest(true));
        Assert.Equal(HttpStatusCode.OK, blockResponse.StatusCode);

        // Cuenta bloqueada: cualquier ruta protegida (no exenta) debe devolver 403 con el código específico.
        var blockedSearch = await barberClient.GetAsync("/api/barbers/search");
        Assert.Equal(HttpStatusCode.Forbidden, blockedSearch.StatusCode);
        var blockedBody = await blockedSearch.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
        Assert.Equal("ACCOUNT_BLOCKED", blockedBody.GetProperty("code").GetString());

        // El endpoint de polling debe seguir siendo alcanzable estando bloqueado.
        var statusWhileBlocked = await barberClient.GetAsync("/api/users/me/status");
        Assert.Equal(HttpStatusCode.OK, statusWhileBlocked.StatusCode);
        var statusBody = await statusWhileBlocked.Content.ReadFromJsonAsync<AppStatusResponse>();
        Assert.True(statusBody!.IsBlocked);

        var unblockResponse = await adminClient.PatchAsJsonAsync($"/api/users/{barber.Id}/block", new SetBlockedRequest(false));
        Assert.Equal(HttpStatusCode.OK, unblockResponse.StatusCode);

        var unblockedSearch = await barberClient.GetAsync("/api/barbers/search");
        Assert.Equal(HttpStatusCode.OK, unblockedSearch.StatusCode);
    }
}
