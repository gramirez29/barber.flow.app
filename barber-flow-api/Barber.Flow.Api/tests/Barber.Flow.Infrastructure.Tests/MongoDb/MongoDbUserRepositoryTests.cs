using Barber.Flow.Domain.Entities;
using Barber.Flow.Infrastructure.Services.Auth;
using Barber.Flow.Infrastructure.Services.MongoDb;
using Microsoft.Extensions.Configuration;
using MongoDB.Driver;

namespace Barber.Flow.Infrastructure.Tests.MongoDb;

[Collection(MongoDbCollection.Name)]
public class MongoDbUserRepositoryTests
{
    private readonly MongoDbFixture _fixture;

    public MongoDbUserRepositoryTests(MongoDbFixture fixture) => _fixture = fixture;

    private static IConfiguration BuildJwtConfig() => new ConfigurationBuilder()
        .AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Jwt:Key"] = "unit-test-signing-key-not-for-production-use",
            ["Jwt:Issuer"] = "BarberFlowApi.Tests",
            ["Jwt:Audience"] = "BarberFlowApi.Tests",
            ["Jwt:ExpiryMinutes"] = "60",
        })
        .Build();

    private MongoDbUserRepository CreateSut() => new(_fixture.CreateDatabase(), BuildJwtConfig());

    private static User BuildUser(string userName = "admin", string password = "password", string email = "admin@example.com") => new()
    {
        Id = Guid.NewGuid(),
        Name = "Admin User",
        UserName = userName,
        Password = password,
        Email = email,
        Role = "Admin",
    };

    [Fact]
    public async Task GetAuthenticationUserAsync_UsernameIsCaseInsensitive_ReturnsUserWithToken()
    {
        var sut = CreateSut();
        var user = BuildUser();
        await sut.CreateAsync(user);

        var result = await sut.GetAuthenticationUserAsync("ADMIN", "password");

        Assert.NotNull(result);
        Assert.False(string.IsNullOrWhiteSpace(result!.Token));
    }

    [Fact]
    public async Task GetAuthenticationUserAsync_PasswordIsCaseSensitive_WrongCaseReturnsNull()
    {
        var sut = CreateSut();
        await sut.CreateAsync(BuildUser());

        var result = await sut.GetAuthenticationUserAsync("admin", "PASSWORD");

        Assert.Null(result);
    }

    [Fact]
    public async Task GetAuthenticationUserAsync_UnknownUser_ReturnsNull()
    {
        var sut = CreateSut();

        var result = await sut.GetAuthenticationUserAsync("missing", "password");

        Assert.Null(result);
    }

    [Fact]
    public async Task CreateAsync_StoresPasswordAsBCryptHash_NotPlainText()
    {
        var sut = CreateSut();
        var user = BuildUser();

        var created = await sut.CreateAsync(user);

        Assert.NotEqual("password", created.Password);
        Assert.True(PasswordHasher.IsHashed(created.Password));
    }

    [Fact]
    public async Task GetAuthenticationUserAsync_LegacyPlainTextPassword_VerifiesAndMigratesToHash()
    {
        var database = _fixture.CreateDatabase();
        var sut = new MongoDbUserRepository(database, BuildJwtConfig());
        var collection = database.GetCollection<User>("users");
        var user = BuildUser();
        // Bypass CreateAsync's hashing to simulate a pre-existing plain-text row.
        await collection.InsertOneAsync(user);

        var firstLogin = await sut.GetAuthenticationUserAsync("admin", "password");
        Assert.NotNull(firstLogin);

        var storedAfterLogin = await collection.Find(u => u.Id == user.Id).FirstOrDefaultAsync();
        Assert.True(PasswordHasher.IsHashed(storedAfterLogin!.Password));

        var secondLogin = await sut.GetAuthenticationUserAsync("admin", "password");
        Assert.NotNull(secondLogin);
    }

    [Fact]
    public async Task GetByEmailAsync_IsCaseInsensitive()
    {
        var sut = CreateSut();
        await sut.CreateAsync(BuildUser(email: "Admin@Example.com"));

        var result = await sut.GetByEmailAsync("admin@example.com");

        Assert.NotNull(result);
    }

    [Fact]
    public async Task GetByIdAsync_ExistingUser_ReturnsIt()
    {
        var sut = CreateSut();
        var user = BuildUser();
        await sut.CreateAsync(user);

        var result = await sut.GetByIdAsync(user.Id);

        Assert.NotNull(result);
        Assert.Equal(user.UserName, result!.UserName);
    }

    [Fact]
    public async Task GetByIdAsync_UnknownUser_ReturnsNull()
    {
        var sut = CreateSut();

        var result = await sut.GetByIdAsync(Guid.NewGuid());

        Assert.Null(result);
    }

    [Fact]
    public async Task UpdatePasswordAsync_ExistingUser_UpdatesPasswordAndReturnsTrue()
    {
        var sut = CreateSut();
        await sut.CreateAsync(BuildUser());

        var updated = await sut.UpdatePasswordAsync("admin", "new-password");

        Assert.True(updated);
        Assert.NotNull(await sut.GetAuthenticationUserAsync("admin", "new-password"));
        Assert.Null(await sut.GetAuthenticationUserAsync("admin", "password"));
    }

    [Fact]
    public async Task UpdatePasswordAsync_UnknownUser_ReturnsFalse()
    {
        var sut = CreateSut();

        var updated = await sut.UpdatePasswordAsync("missing", "new-password");

        Assert.False(updated);
    }

    [Fact]
    public async Task DeleteAsync_ExistingUser_RemovesItAndReturnsTrue()
    {
        var sut = CreateSut();
        var user = BuildUser();
        await sut.CreateAsync(user);

        var deleted = await sut.DeleteAsync(user.Id.ToString());

        Assert.True(deleted);
        Assert.Null(await sut.GetAuthenticationUserAsync("admin", "password"));
    }

    [Fact]
    public async Task DeleteAsync_UnknownUser_ReturnsFalse()
    {
        var sut = CreateSut();

        var deleted = await sut.DeleteAsync(Guid.NewGuid().ToString());

        Assert.False(deleted);
    }
}
