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

    // Creates a barber (+ linked login) as admin and returns it, so tests can act as that barber.
    private async Task<BarberResponse> CreateBarberAsAdminAsync(string userName, string email)
    {
        var admin = await CreateAuthenticatedClientAsync("admin", "password");
        var request = BuildRequest() with { UserName = userName, UserEmail = email, BarberName = userName, Password = "secret123" };
        var response = await admin.PostAsJsonAsync("/api/barbers/create", request);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<BarberResponse>())!;
    }

    [Fact]
    public async Task Search_AsAdmin_ReturnsAllBarbers()
    {
        await CreateBarberAsAdminAsync("tenant-a-admin-view", "a-admin-view@example.com");
        await CreateBarberAsAdminAsync("tenant-b-admin-view", "b-admin-view@example.com");
        var admin = await CreateAuthenticatedClientAsync("admin", "password");

        var list = await admin.GetFromJsonAsync<List<BarberResponse>>("/api/barbers/search");

        Assert.Contains(list!, b => b.UserName == "tenant-a-admin-view");
        Assert.Contains(list!, b => b.UserName == "tenant-b-admin-view");
    }

    [Fact]
    public async Task Search_AsBarber_ReturnsOnlyOwnRecord()
    {
        await CreateBarberAsAdminAsync("tenant-a-search", "a-search@example.com");
        await CreateBarberAsAdminAsync("tenant-b-search", "b-search@example.com");
        var barberA = await CreateAuthenticatedClientAsync("tenant-a-search", "secret123");

        var list = await barberA.GetFromJsonAsync<List<BarberResponse>>("/api/barbers/search");

        var only = Assert.Single(list!);
        Assert.Equal("tenant-a-search", only.UserName);
    }

    [Fact]
    public async Task Search_AsBarber_CannotEnumerateOthersEvenWithQuery()
    {
        await CreateBarberAsAdminAsync("tenant-a-enum", "a-enum@example.com");
        await CreateBarberAsAdminAsync("tenant-b-enum", "b-enum@example.com");
        var barberA = await CreateAuthenticatedClientAsync("tenant-a-enum", "secret123");

        var list = await barberA.GetFromJsonAsync<List<BarberResponse>>("/api/barbers/search?query=tenant-b-enum");

        Assert.DoesNotContain(list!, b => b.UserName == "tenant-b-enum");
    }

    [Fact]
    public async Task GetById_AsBarber_OwnRecord_ReturnsOk()
    {
        var own = await CreateBarberAsAdminAsync("tenant-a-getown", "a-getown@example.com");
        var barberA = await CreateAuthenticatedClientAsync("tenant-a-getown", "secret123");

        var response = await barberA.GetAsync($"/api/barbers/getById/{own.Id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetById_AsBarber_OtherBarbersRecord_ReturnsNotFound()
    {
        await CreateBarberAsAdminAsync("tenant-a-getother", "a-getother@example.com");
        var other = await CreateBarberAsAdminAsync("tenant-b-getother", "b-getother@example.com");
        var barberA = await CreateAuthenticatedClientAsync("tenant-a-getother", "secret123");

        var response = await barberA.GetAsync($"/api/barbers/getById/{other.Id}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetById_AsAdmin_AnyBarber_ReturnsOk()
    {
        var other = await CreateBarberAsAdminAsync("tenant-b-getadmin", "b-getadmin@example.com");
        var admin = await CreateAuthenticatedClientAsync("admin", "password");

        var response = await admin.GetAsync($"/api/barbers/getById/{other.Id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task NextId_AsBarber_ReturnsForbidden()
    {
        var barber = await CreateAuthenticatedClientAsync("barber", "barber");

        var response = await barber.GetAsync("/api/barbers/nextId");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Create_WithUserNameAlreadyUsedByAnotherBarber_ReturnsConflictWithCode()
    {
        await CreateBarberAsAdminAsync("dup-username", "dup1@example.com");
        var admin = await CreateAuthenticatedClientAsync("admin", "password");
        // Different casing and no password: only the barber-level check can catch this one.
        var request = BuildRequest() with { UserName = "DUP-Username", UserEmail = "dup2@example.com", Password = null };

        var response = await admin.PostAsJsonAsync("/api/barbers/create", request);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("BARBER_DUPLICATE_USERNAME", body);
    }

    [Fact]
    public async Task Create_WithUserNameOfExistingLoginAccount_ReturnsConflict()
    {
        // The seeded "barber" login has no Barber record, so only the user-level check catches it.
        var admin = await CreateAuthenticatedClientAsync("admin", "password");
        var request = BuildRequest() with { UserName = "barber", UserEmail = "barber-dup@example.com", Password = "secret123" };

        var response = await admin.PostAsJsonAsync("/api/barbers/create", request);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Update_RenamingToAnotherBarbersUserName_ReturnsConflict()
    {
        await CreateBarberAsAdminAsync("rename-target", "rename-target@example.com");
        var second = await CreateBarberAsAdminAsync("rename-source", "rename-source@example.com");
        var admin = await CreateAuthenticatedClientAsync("admin", "password");
        var request = BuildRequest() with { UserName = "rename-target", UserEmail = "rename-source@example.com", BarberName = "rename-source", Password = null };

        var response = await admin.PutAsJsonAsync($"/api/barbers/update/{second.Id}", request);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task NextId_AsAdmin_ReturnsOk()
    {
        var admin = await CreateAuthenticatedClientAsync("admin", "password");

        var response = await admin.GetAsync("/api/barbers/nextId");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
