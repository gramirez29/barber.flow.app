using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Barber.Flow.Api.DTOs.Requests;
using Barber.Flow.Api.DTOs.Responses;

namespace Barber.Flow.Api.Tests.Apis;

public class BarberShopsApiTests : IClassFixture<ApiWebApplicationFactory>
{
    private readonly ApiWebApplicationFactory _factory;

    public BarberShopsApiTests(ApiWebApplicationFactory factory) => _factory = factory;

    private async Task<HttpClient> CreateAuthenticatedClientAsync()
    {
        var client = _factory.CreateClient();
        var loginResponse = await client.PostAsJsonAsync("/api/users/authentication", new AuthRequest { UserName = "admin", Password = "password" });
        var user = await loginResponse.Content.ReadFromJsonAsync<UserResponse>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", user!.Token);
        return client;
    }

    [Fact]
    public async Task List_WithoutToken_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/barbershops/list");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Create_WithToken_ReturnsCreatedShopWithShopPrefixId()
    {
        var client = await CreateAuthenticatedClientAsync();
        var request = new BarberShopRequest("Integration Test Shop", "8888-0000", null);

        var response = await client.PostAsJsonAsync("/api/barbershops/create", request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<BarberShopResponse>();
        Assert.NotNull(created);
        Assert.StartsWith("SHOP-", created!.Id);
    }

    [Fact]
    public async Task GetById_ShopNotFound_ReturnsNotFound()
    {
        var client = await CreateAuthenticatedClientAsync();

        var response = await client.GetAsync("/api/barbershops/getById/missing-id");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
