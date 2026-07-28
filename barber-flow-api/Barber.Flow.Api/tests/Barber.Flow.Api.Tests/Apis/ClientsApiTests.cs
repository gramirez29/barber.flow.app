using System.Net;
using System.Net.Http.Json;
using Barber.Flow.Api.DTOs.Requests;
using Barber.Flow.Api.DTOs.Responses;

namespace Barber.Flow.Api.Tests.Apis;

public class ClientsApiTests : IClassFixture<ApiWebApplicationFactory>
{
    private readonly HttpClient _client;

    public ClientsApiTests(ApiWebApplicationFactory factory) => _client = factory.CreateClient();

    [Fact]
    public async Task CreateClient_AllowsAnonymousAndReturnsCreatedClient()
    {
        var request = new ClientRequest("Test", "Client", "9999-0000", null, null, null, null, null, true, null, null);

        var response = await _client.PostAsJsonAsync("/api/clients/create", request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<ClientResponse>();
        Assert.NotNull(created);
        Assert.Equal("Test", created!.FirstName);
    }

    [Fact]
    public async Task DeleteClient_WithoutToken_ReturnsUnauthorized()
    {
        var response = await _client.DeleteAsync("/api/clients/delete/some-id");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task UpdateClient_WithoutToken_ReturnsUnauthorized()
    {
        var request = new ClientRequest("Test", "Client", "9999-0001", null, null, null, null, null, true, null, null);

        var response = await _client.PutAsJsonAsync("/api/clients/update/some-id", request);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetById_ClientNotFound_ReturnsNotFound()
    {
        var response = await _client.GetAsync("/api/clients/getById/missing-id");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
