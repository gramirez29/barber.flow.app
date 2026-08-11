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

    private async Task<HttpClient> CreateAuthenticatedClientAsync(string userName = "admin", string password = "password")
    {
        var client = _factory.CreateClient();
        var loginResponse = await client.PostAsJsonAsync("/api/users/authentication", new AuthRequest { UserName = userName, Password = password });
        var user = await loginResponse.Content.ReadFromJsonAsync<UserResponse>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", user!.Token);
        return client;
    }

    /// <summary>
    /// Creates a real Barber account (via the admin-only /api/barbers/create endpoint), which is
    /// what gives it its own unique ShopId - the tenant boundary appointment/client ownership
    /// checks are keyed on. Returns an authenticated client logged in as that new barber.
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

    [Fact]
    public async Task OtherBarber_CannotGetUpdateDeleteOrMoveAppointmentTheyDoNotOwn()
    {
        var barberA = await CreateBarberClientAsync($"barberA-{Guid.NewGuid():N}");
        var barberB = await CreateBarberClientAsync($"barberB-{Guid.NewGuid():N}");

        var createRequest = new AppointmentRequest("Owned By A", "9999-0002", null, "2031-02-10", "09:00", "scheduled", null, null, null, null, null, null);
        var createResponse = await barberA.PostAsJsonAsync("/api/appointments/create", createRequest);
        createResponse.EnsureSuccessStatusCode();
        var created = await createResponse.Content.ReadFromJsonAsync<AppointmentResponse>();

        var getResponse = await barberB.GetAsync($"/api/appointments/getById/{created!.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);

        var updateRequest = new AppointmentRequest("Owned By A", "9999-0002", null, "2031-02-10", "09:00", "confirmed", null, null, null, null, null, null);
        var updateResponse = await barberB.PutAsJsonAsync($"/api/appointments/update/{created.Id}", updateRequest);
        Assert.Equal(HttpStatusCode.NotFound, updateResponse.StatusCode);

        var deleteResponse = await barberB.DeleteAsync($"/api/appointments/delete/{created.Id}");
        Assert.Equal(HttpStatusCode.NotFound, deleteResponse.StatusCode);

        var moveResponse = await barberB.PatchAsync($"/api/appointments/move/{created.Id}", JsonContent.Create(new MoveAppointmentRequest("2031-02-11", "10:00")));
        Assert.Equal(HttpStatusCode.NotFound, moveResponse.StatusCode);

        // The owner can still access their own appointment.
        var ownerGetResponse = await barberA.GetAsync($"/api/appointments/getById/{created.Id}");
        Assert.Equal(HttpStatusCode.OK, ownerGetResponse.StatusCode);
    }

    [Fact]
    public async Task Admin_CanAccessAnyBarbersAppointment()
    {
        var barberA = await CreateBarberClientAsync($"barberC-{Guid.NewGuid():N}");
        var createRequest = new AppointmentRequest("Owned By C", "9999-0003", null, "2031-02-12", "09:00", "scheduled", null, null, null, null, null, null);
        var createResponse = await barberA.PostAsJsonAsync("/api/appointments/create", createRequest);
        createResponse.EnsureSuccessStatusCode();
        var created = await createResponse.Content.ReadFromJsonAsync<AppointmentResponse>();

        var adminClient = await CreateAuthenticatedClientAsync();
        var response = await adminClient.GetAsync($"/api/appointments/getById/{created!.Id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Search_OnlyReturnsCallersOwnAppointments()
    {
        var barberA = await CreateBarberClientAsync($"barberD-{Guid.NewGuid():N}");
        var barberB = await CreateBarberClientAsync($"barberE-{Guid.NewGuid():N}");

        var requestA = new AppointmentRequest("Search Owned By D", "9999-0004", null, "2031-02-13", "09:00", "scheduled", null, null, null, null, null, null);
        await (await barberA.PostAsJsonAsync("/api/appointments/create", requestA)).Content.ReadAsStringAsync();

        var searchResponse = await barberB.GetAsync("/api/appointments/search?date=2031-02-13");
        var results = await searchResponse.Content.ReadFromJsonAsync<List<AppointmentResponse>>();

        Assert.DoesNotContain(results!, a => a.ClientName == "Search Owned By D");
    }
}
