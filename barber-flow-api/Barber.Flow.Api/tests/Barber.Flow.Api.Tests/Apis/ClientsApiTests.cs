using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Barber.Flow.Api.DTOs.Requests;
using Barber.Flow.Api.DTOs.Responses;
using Barber.Flow.Domain.Interfaces;
using Microsoft.Extensions.DependencyInjection;

namespace Barber.Flow.Api.Tests.Apis;

public class ClientsApiTests : IClassFixture<ApiWebApplicationFactory>
{
    private readonly ApiWebApplicationFactory _factory;

    public ClientsApiTests(ApiWebApplicationFactory factory) => _factory = factory;

    private async Task<HttpClient> CreateAuthenticatedClientAsync(string userName = "admin", string password = "password")
    {
        var client = _factory.CreateClient();
        var loginResponse = await client.PostAsJsonAsync("/api/users/authentication", new AuthRequest { UserName = userName, Password = password });
        var user = await loginResponse.Content.ReadFromJsonAsync<UserResponse>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", user!.Token);
        return client;
    }

    /// <summary>
    /// Creates a real Barber account (via the admin-only /api/barbers/create endpoint). Returns
    /// an authenticated client logged in as that new barber. Client ownership checks are keyed
    /// on the barber's own username (CreatedBy), not the shop they belong to.
    /// </summary>
    private async Task<HttpClient> CreateBarberClientAsync(string userName)
    {
        var adminClient = await CreateAuthenticatedClientAsync();
        var request = new BarberRequest(
            UserName: userName,
            UserPhone: "8888-0000",
            UserEmail: $"{userName}@example.com",
            BarberName: userName,
            BarberPhone: "8888-0000",
            Address: null,
            BarberShopName: null,
            BarberShopPhone: null,
            PhotoUrl: null,
            Password: "password123",
            Settings: null,
            ShopId: null
        );
        var response = await adminClient.PostAsJsonAsync("/api/barbers/create", request);
        response.EnsureSuccessStatusCode();

        return await CreateAuthenticatedClientAsync(userName, "password123");
    }

    [Fact]
    public async Task CreateClient_WithoutToken_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();
        var request = new ClientRequest("Test", "Client", "9999-0000", null, null, null, null, null, true, null, null);

        var response = await client.PostAsJsonAsync("/api/clients/create", request);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task CreateClient_WithToken_ReturnsCreatedClient()
    {
        var client = await CreateAuthenticatedClientAsync();
        var request = new ClientRequest("Test", "Client", "9999-0002", null, null, null, null, null, true, null, null);

        var response = await client.PostAsJsonAsync("/api/clients/create", request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<ClientResponse>();
        Assert.NotNull(created);
        Assert.Equal("Test", created!.FirstName);
    }

    [Fact]
    public async Task DeleteClient_WithoutToken_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();
        var response = await client.DeleteAsync("/api/clients/delete/some-id");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task UpdateClient_WithoutToken_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();
        var request = new ClientRequest("Test", "Client", "9999-0001", null, null, null, null, null, true, null, null);

        var response = await client.PutAsJsonAsync("/api/clients/update/some-id", request);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Search_WithoutToken_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/clients/search");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetById_ClientNotFound_ReturnsNotFound()
    {
        var client = await CreateAuthenticatedClientAsync();
        var response = await client.GetAsync("/api/clients/getById/missing-id");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task OtherBarber_CannotGetUpdateOrDeleteClientTheyDoNotOwn()
    {
        var barberA = await CreateBarberClientAsync($"barberA-{Guid.NewGuid():N}");
        var barberB = await CreateBarberClientAsync($"barberB-{Guid.NewGuid():N}");

        var createRequest = new ClientRequest("Owned", "ByA", "9999-1000", null, null, null, null, null, true, null, null);
        var createResponse = await barberA.PostAsJsonAsync("/api/clients/create", createRequest);
        createResponse.EnsureSuccessStatusCode();
        var created = await createResponse.Content.ReadFromJsonAsync<ClientResponse>();

        var getResponse = await barberB.GetAsync($"/api/clients/getById/{created!.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);

        var updateRequest = new ClientRequest("Owned", "ByA", "9999-1000", null, null, null, null, null, false, null, null);
        var updateResponse = await barberB.PutAsJsonAsync($"/api/clients/update/{created.Id}", updateRequest);
        Assert.Equal(HttpStatusCode.NotFound, updateResponse.StatusCode);

        var deleteResponse = await barberB.DeleteAsync($"/api/clients/delete/{created.Id}");
        Assert.Equal(HttpStatusCode.NotFound, deleteResponse.StatusCode);

        // The owner can still access their own client.
        var ownerGetResponse = await barberA.GetAsync($"/api/clients/getById/{created.Id}");
        Assert.Equal(HttpStatusCode.OK, ownerGetResponse.StatusCode);
    }

    [Fact]
    public async Task OtherBarber_CannotAccessClient_EvenWhenSharingShopId()
    {
        // Mirrors AppointmentsApiTests' equivalent - the /api/barbers/create flow always mints
        // a brand-new, unique shop per barber, so this forces the "same physical shop, two
        // barbers" scenario directly against the repository to prove client ownership is
        // enforced by CreatedBy, not ShopId.
        var userNameA = $"barberF-{Guid.NewGuid():N}";
        var userNameB = $"barberG-{Guid.NewGuid():N}";
        var barberA = await CreateBarberClientAsync(userNameA);
        var barberB = await CreateBarberClientAsync(userNameB);

        using var scope = _factory.Services.CreateScope();
        var barberRepository = scope.ServiceProvider.GetRequiredService<IBarberRepository>();
        var entityA = await barberRepository.GetByUserNameAsync(userNameA);
        var entityB = await barberRepository.GetByUserNameAsync(userNameB);
        Assert.NotNull(entityA);
        Assert.NotNull(entityB);

        entityB!.ShopId = entityA!.ShopId;
        await barberRepository.UpdateAsync(entityB.Id, entityB);

        var createRequest = new ClientRequest("Owned", "ByF", "9999-1003", null, null, null, null, null, true, null, null);
        var createResponse = await barberA.PostAsJsonAsync("/api/clients/create", createRequest);
        createResponse.EnsureSuccessStatusCode();
        var created = await createResponse.Content.ReadFromJsonAsync<ClientResponse>();

        var getResponse = await barberB.GetAsync($"/api/clients/getById/{created!.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);

        var searchResponse = await barberB.GetAsync("/api/clients/search");
        var results = await searchResponse.Content.ReadFromJsonAsync<List<ClientResponse>>();
        Assert.DoesNotContain(results!, c => c.LastName == "ByF");
    }

    [Fact]
    public async Task Admin_CanAccessAnyBarbersClient()
    {
        var barberA = await CreateBarberClientAsync($"barberC-{Guid.NewGuid():N}");
        var createRequest = new ClientRequest("Owned", "ByC", "9999-1001", null, null, null, null, null, true, null, null);
        var createResponse = await barberA.PostAsJsonAsync("/api/clients/create", createRequest);
        createResponse.EnsureSuccessStatusCode();
        var created = await createResponse.Content.ReadFromJsonAsync<ClientResponse>();

        var adminClient = await CreateAuthenticatedClientAsync();
        var response = await adminClient.GetAsync($"/api/clients/getById/{created!.Id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Search_OnlyReturnsCallersOwnClients()
    {
        var barberA = await CreateBarberClientAsync($"barberD-{Guid.NewGuid():N}");
        var barberB = await CreateBarberClientAsync($"barberE-{Guid.NewGuid():N}");

        var requestA = new ClientRequest("Search", "OwnedByD", "9999-1002", null, null, null, null, null, true, null, null);
        await (await barberA.PostAsJsonAsync("/api/clients/create", requestA)).Content.ReadAsStringAsync();

        var searchResponse = await barberB.GetAsync("/api/clients/search");
        var results = await searchResponse.Content.ReadFromJsonAsync<List<ClientResponse>>();

        Assert.DoesNotContain(results!, c => c.LastName == "OwnedByD");
    }
}
