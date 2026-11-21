using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Barber.Flow.Api.DTOs.Requests;
using Barber.Flow.Api.DTOs.Responses;

namespace Barber.Flow.Api.Tests.Apis;

/// <summary>
/// The privacy policy promises that deleting an account erases the profile, the client list and the
/// appointment history. These tests pin that end to end (InMemory repositories), for both ways an
/// account can be deleted: the barber deleting themselves and the admin deleting a barber.
/// </summary>
public class AccountDeletionApiTests : IClassFixture<ApiWebApplicationFactory>
{
    private const string Password = "password123";

    private readonly ApiWebApplicationFactory _factory;

    public AccountDeletionApiTests(ApiWebApplicationFactory factory) => _factory = factory;

    private async Task<(HttpClient Client, HttpStatusCode Status)> TryLoginAsync(string userName, string password)
    {
        var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/users/authentication", new AuthRequest { UserName = userName, Password = password });
        if (response.StatusCode == HttpStatusCode.OK)
        {
            var user = await response.Content.ReadFromJsonAsync<UserResponse>();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", user!.Token);
        }

        return (client, response.StatusCode);
    }

    private async Task<HttpClient> LoginAsync(string userName, string password = "password")
    {
        var (client, status) = await TryLoginAsync(userName, password);
        Assert.Equal(HttpStatusCode.OK, status);
        return client;
    }

    private async Task<BarberResponse> CreateBarberAsAdminAsync(string userName)
    {
        var admin = await LoginAsync("admin");
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
            Password: Password,
            Settings: null,
            ShopId: null);
        var response = await admin.PostAsJsonAsync("/api/barbers/create", request);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<BarberResponse>())!;
    }

    // Creates a client and an appointment owned by the given barber and returns their ids.
    private static async Task<(string ClientId, string AppointmentId)> SeedDataAsync(HttpClient barber, string phone, string date)
    {
        var clientResponse = await barber.PostAsJsonAsync("/api/clients/create",
            new ClientRequest("Cliente", "Prueba", phone, null, null, null, null, null, true, null, null));
        clientResponse.EnsureSuccessStatusCode();
        var client = (await clientResponse.Content.ReadFromJsonAsync<ClientResponse>())!;

        var appointmentResponse = await barber.PostAsJsonAsync("/api/appointments/create",
            new AppointmentRequest("Cliente Prueba", phone, null, date, "10:00", "scheduled", null, null, null, null, null, null));
        appointmentResponse.EnsureSuccessStatusCode();
        var appointment = (await appointmentResponse.Content.ReadFromJsonAsync<AppointmentResponse>())!;

        return (client.Id, appointment.Id);
    }

    [Fact]
    public async Task DeleteSelf_RemovesTheLoginProfileClientsAndAppointments()
    {
        var name = $"leaver-{Guid.NewGuid():N}";
        var created = await CreateBarberAsAdminAsync(name);
        var barber = await LoginAsync(name, Password);
        var (clientId, appointmentId) = await SeedDataAsync(barber, "7000-1001", "2031-05-10");

        var response = await barber.DeleteAsync("/api/users/me");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        // The login no longer works.
        var (_, loginStatus) = await TryLoginAsync(name, Password);
        Assert.Equal(HttpStatusCode.BadRequest, loginStatus);

        // The admin can no longer find the barber, its client or its appointment.
        var admin = await LoginAsync("admin");
        Assert.Equal(HttpStatusCode.NotFound, (await admin.GetAsync($"/api/barbers/getById/{created.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await admin.GetAsync($"/api/clients/getById/{clientId}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await admin.GetAsync($"/api/appointments/getById/{appointmentId}")).StatusCode);
    }

    [Fact]
    public async Task DeleteSelf_DoesNotTouchAnotherBarbersData()
    {
        var leaverName = $"leaver-{Guid.NewGuid():N}";
        var keeperName = $"keeper-{Guid.NewGuid():N}";
        await CreateBarberAsAdminAsync(leaverName);
        var keeperRecord = await CreateBarberAsAdminAsync(keeperName);
        var leaver = await LoginAsync(leaverName, Password);
        var keeper = await LoginAsync(keeperName, Password);
        await SeedDataAsync(leaver, "7000-2001", "2031-05-11");
        var (keeperClientId, keeperAppointmentId) = await SeedDataAsync(keeper, "7000-2002", "2031-05-11");

        var response = await leaver.DeleteAsync("/api/users/me");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await keeper.GetAsync($"/api/clients/getById/{keeperClientId}")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await keeper.GetAsync($"/api/appointments/getById/{keeperAppointmentId}")).StatusCode);
        var admin = await LoginAsync("admin");
        Assert.Equal(HttpStatusCode.OK, (await admin.GetAsync($"/api/barbers/getById/{keeperRecord.Id}")).StatusCode);
    }

    [Fact]
    public async Task DeleteSelf_AsAdmin_IsForbiddenAndTheAccountSurvives()
    {
        var admin = await LoginAsync("admin");

        var response = await admin.DeleteAsync("/api/users/me");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        var (_, loginStatus) = await TryLoginAsync("admin", "password");
        Assert.Equal(HttpStatusCode.OK, loginStatus);
    }

    [Fact]
    public async Task AdminDeletesBarber_RemovesTheLoginAndAllTheirData()
    {
        var name = $"removed-{Guid.NewGuid():N}";
        var created = await CreateBarberAsAdminAsync(name);
        var barber = await LoginAsync(name, Password);
        var (clientId, appointmentId) = await SeedDataAsync(barber, "7000-3001", "2031-05-12");
        var admin = await LoginAsync("admin");

        var response = await admin.DeleteAsync($"/api/barbers/delete/{created.Id}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        var (_, loginStatus) = await TryLoginAsync(name, Password);
        Assert.Equal(HttpStatusCode.BadRequest, loginStatus);
        Assert.Equal(HttpStatusCode.NotFound, (await admin.GetAsync($"/api/barbers/getById/{created.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await admin.GetAsync($"/api/clients/getById/{clientId}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await admin.GetAsync($"/api/appointments/getById/{appointmentId}")).StatusCode);
    }

    [Fact]
    public async Task AdminDeletesBarber_UnknownId_ReturnsNotFound()
    {
        var admin = await LoginAsync("admin");

        var response = await admin.DeleteAsync("/api/barbers/delete/CRB-9999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task BarberCannotDeleteAnotherBarber()
    {
        var victimName = $"victim-{Guid.NewGuid():N}";
        var attackerName = $"attacker-{Guid.NewGuid():N}";
        var victim = await CreateBarberAsAdminAsync(victimName);
        await CreateBarberAsAdminAsync(attackerName);
        var attacker = await LoginAsync(attackerName, Password);

        var response = await attacker.DeleteAsync($"/api/barbers/delete/{victim.Id}");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        var (_, loginStatus) = await TryLoginAsync(victimName, Password);
        Assert.Equal(HttpStatusCode.OK, loginStatus);
    }
}
