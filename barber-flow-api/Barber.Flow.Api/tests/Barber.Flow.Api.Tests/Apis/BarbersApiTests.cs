using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Barber.Flow.Api.DTOs.Requests;
using Barber.Flow.Api.DTOs.Responses;

namespace Barber.Flow.Api.Tests.Apis;

public class BarbersApiTests : IClassFixture<ApiWebApplicationFactory>
{
    private readonly ApiWebApplicationFactory _factory;

    public BarbersApiTests(ApiWebApplicationFactory factory) => _factory = factory;

    private async Task<HttpClient> CreateAuthenticatedClientAsync(string userName, string password)
    {
        var client = _factory.CreateClient();
        var loginResponse = await client.PostAsJsonAsync("/api/users/authentication", new AuthRequest { UserName = userName, Password = password });
        var user = await loginResponse.Content.ReadFromJsonAsync<UserResponse>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", user!.Token);
        return client;
    }

    private static BarberRequest BuildRequest() => new(
        UserName: "New Barber",
        UserPhone: "8888-0000",
        UserEmail: "newbarber@example.com",
        BarberName: "New Barber",
        BarberPhone: "8888-0000",
        Address: null,
        BarberShopName: null,
        BarberShopPhone: null,
        PhotoUrl: null,
        Password: null,
        Settings: null,
        ShopId: null
    );

    [Fact]
    public async Task Create_AsNonAdminUser_ReturnsForbidden()
    {
        // Seeded InMemoryUserRepository ships a non-admin "barber"/"barber" user.
        var client = await CreateAuthenticatedClientAsync("barber", "barber");

        var response = await client.PostAsJsonAsync("/api/barbers/create", BuildRequest());

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Create_AsAdminUser_ReturnsOk()
    {
        var client = await CreateAuthenticatedClientAsync("admin", "password");

        var response = await client.PostAsJsonAsync("/api/barbers/create", BuildRequest());

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<BarberResponse>();
        Assert.NotNull(created);
        Assert.StartsWith("CRB-", created!.Id);
    }

    [Fact]
    public async Task Create_WithLinkedUser_ResponseIncludesUserIdAndBlockStatus()
    {
        var client = await CreateAuthenticatedClientAsync("admin", "password");
        var request = BuildRequest() with { UserName = "linked-barber", Password = "secret123" };

        var response = await client.PostAsJsonAsync("/api/barbers/create", request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<BarberResponse>();
        Assert.NotNull(created);
        Assert.NotNull(created!.UserId);
        Assert.False(created.IsBlocked);
    }

    [Fact]
    public async Task Create_WithEmailAlreadyUsedByAnotherAccount_ReturnsConflict()
    {
        // Seeded InMemoryUserRepository ships "admin" with email "g.raba29@gmail.com" - reusing
        // it here reproduces the 2026-08-21 incident where a barber created with the admin's
        // email caused password-reset lookups (by email) to silently reset the admin account.
        var client = await CreateAuthenticatedClientAsync("admin", "password");
        var request = BuildRequest() with { UserName = "duplicate-email-barber", UserEmail = "g.raba29@gmail.com", Password = "secret123" };

        var response = await client.PostAsJsonAsync("/api/barbers/create", request);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Search_WithoutToken_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/barbers/search");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Search_WithToken_ReturnsOk()
    {
        var client = await CreateAuthenticatedClientAsync("admin", "password");

        var response = await client.GetAsync("/api/barbers/search");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
