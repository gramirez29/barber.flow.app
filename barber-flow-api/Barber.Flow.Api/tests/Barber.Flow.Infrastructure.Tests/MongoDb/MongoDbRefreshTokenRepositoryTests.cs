using Barber.Flow.Domain.Entities;
using Barber.Flow.Infrastructure.Services.MongoDb;
using MongoDB.Driver;

namespace Barber.Flow.Infrastructure.Tests.MongoDb;

[Collection(MongoDbCollection.Name)]
public class MongoDbRefreshTokenRepositoryTests
{
    private readonly MongoDbFixture _fixture;

    public MongoDbRefreshTokenRepositoryTests(MongoDbFixture fixture) => _fixture = fixture;

    private MongoDbRefreshTokenRepository CreateSut() => new(_fixture.CreateDatabase());

    private static RefreshToken BuildToken(string userId, string token, int expiresInDays = 30) => new()
    {
        UserId = userId,
        Token = token,
        ExpiresAt = DateTime.UtcNow.AddDays(expiresInDays),
    };

    [Fact]
    public async Task GetValidTokenAsync_MatchingActiveToken_ReturnsIt()
    {
        var sut = CreateSut();
        var userId = Guid.NewGuid().ToString();
        var token = BuildToken(userId, "token-value");
        await sut.SaveTokenAsync(token);

        var result = await sut.GetValidTokenAsync("token-value");

        Assert.NotNull(result);
        Assert.Equal(token.Id, result!.Id);
    }

    [Fact]
    public async Task GetValidTokenAsync_UnknownToken_ReturnsNull()
    {
        var sut = CreateSut();

        var result = await sut.GetValidTokenAsync("does-not-exist");

        Assert.Null(result);
    }

    [Fact]
    public async Task GetValidTokenAsync_ExpiredToken_ReturnsNull()
    {
        var sut = CreateSut();
        var userId = Guid.NewGuid().ToString();
        await sut.SaveTokenAsync(BuildToken(userId, "expired-token", expiresInDays: -1));

        var result = await sut.GetValidTokenAsync("expired-token");

        Assert.Null(result);
    }

    [Fact]
    public async Task GetValidTokenAsync_RevokedToken_ReturnsNull()
    {
        var sut = CreateSut();
        var userId = Guid.NewGuid().ToString();
        var token = BuildToken(userId, "revoked-token");
        await sut.SaveTokenAsync(token);

        await sut.RevokeAsync(token.Id);

        var result = await sut.GetValidTokenAsync("revoked-token");
        Assert.Null(result);
    }

    [Fact]
    public async Task SaveTokenAsync_StoresHashedTokenNotRawValue()
    {
        var database = _fixture.CreateDatabase();
        var sut = new MongoDbRefreshTokenRepository(database);
        var userId = Guid.NewGuid().ToString();
        var token = BuildToken(userId, "plaintext-token-value");

        await sut.SaveTokenAsync(token);

        var stored = await database.GetCollection<RefreshToken>("refresh_tokens")
            .Find(Builders<RefreshToken>.Filter.Eq(t => t.Id, token.Id))
            .FirstOrDefaultAsync();

        Assert.NotNull(stored);
        Assert.NotEqual("plaintext-token-value", stored!.Token);
    }
}
