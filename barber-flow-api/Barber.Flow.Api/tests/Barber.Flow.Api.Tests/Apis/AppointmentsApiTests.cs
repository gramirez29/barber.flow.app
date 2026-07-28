using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Barber.Flow.Api.DTOs.Requests;
using Barber.Flow.Api.DTOs.Responses;

namespace Barber.Flow.Api.Tests.Apis;

public class AppointmentsApiTests : IClassFixture<ApiWebApplicationFactory>
{
    private readonly ApiWebApplicationFactory _factory;

    public AppointmentsApiTests(ApiWebApplicationFactory factory) => _factory = factory;

    private async Task<HttpClient> CreateAuthenticatedClientAsync()
    {
        var client = _factory.CreateClient();
        var loginResponse = await client.PostAsJsonAsync("/api/users/authentication", new AuthRequest { UserName = "admin", Password = "password" });
        var user = await loginResponse.Content.ReadFromJsonAsync<UserResponse>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", user!.Token);
        return client;
    }

    [Fact]
    public async Task Create_WithoutToken_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();
        var request = new AppointmentRequest("Test Client", "9999-0000", null, "2031-01-15", "10:00", "scheduled", null, null, null, null, null, null);

        var response = await client.PostAsJsonAsync("/api/appointments/create", request);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Create_WithToken_ReturnsCreatedAppointment()
    {
        var client = await CreateAuthenticatedClientAsync();
        var request = new AppointmentRequest("Test Client", "9999-0001", null, "2031-01-15", "10:00", "scheduled", null, null, null, null, null, null);

        var response = await client.PostAsJsonAsync("/api/appointments/create", request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<AppointmentResponse>();
        Assert.NotNull(created);
        Assert.StartsWith("APT-", created!.Id);
    }

    [Fact]
    public async Task Move_AppointmentNotFound_ReturnsNotFound()
    {
        var client = await CreateAuthenticatedClientAsync();

        var response = await client.PatchAsync("/api/appointments/move/APT-9999", JsonContent.Create(new MoveAppointmentRequest("2031-03-01")));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
