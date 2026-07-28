using Barber.Flow.Domain.Entities;
using Barber.Flow.Infrastructure.Services.MongoDb;

namespace Barber.Flow.Infrastructure.Tests.MongoDb;

[Collection(MongoDbCollection.Name)]
public class MongoDbPasswordResetRepositoryTests
{
    private readonly MongoDbFixture _fixture;

    public MongoDbPasswordResetRepositoryTests(MongoDbFixture fixture) => _fixture = fixture;

    private MongoDbPasswordResetRepository CreateSut() => new(_fixture.CreateDatabase());

    private static PasswordResetToken BuildToken(string userId, string otp = "123456", int expiresInMinutes = 15) => new()
    {
        UserId = userId,
        OtpCode = otp,
        ExpiresAt = DateTime.UtcNow.AddMinutes(expiresInMinutes),
    };

    [Fact]
    public async Task GetValidTokenAsync_MatchingActiveToken_ReturnsIt()
    {
        var sut = CreateSut();
        var userId = Guid.NewGuid().ToString();
        var token = BuildToken(userId);
        await sut.SaveTokenAsync(token);

        var result = await sut.GetValidTokenAsync(userId, "123456");

        Assert.NotNull(result);
        Assert.Equal(token.Id, result!.Id);
    }

    [Fact]
    public async Task GetValidTokenAsync_WrongOtpCode_ReturnsNull()
    {
        var sut = CreateSut();
        var userId = Guid.NewGuid().ToString();
        await sut.SaveTokenAsync(BuildToken(userId, otp: "123456"));

        var result = await sut.GetValidTokenAsync(userId, "000000");

        Assert.Null(result);
    }

    [Fact]
    public async Task GetValidTokenAsync_ExpiredToken_ReturnsNull()
    {
        var sut = CreateSut();
        var userId = Guid.NewGuid().ToString();
        await sut.SaveTokenAsync(BuildToken(userId, expiresInMinutes: -5));

        var result = await sut.GetValidTokenAsync(userId, "123456");

        Assert.Null(result);
    }

    [Fact]
    public async Task GetValidTokenAsync_AlreadyUsedToken_ReturnsNull()
    {
        var sut = CreateSut();
        var userId = Guid.NewGuid().ToString();
        var token = BuildToken(userId);
        await sut.SaveTokenAsync(token);
        await sut.MarkAsUsedAsync(token.Id);

        var result = await sut.GetValidTokenAsync(userId, "123456");

        Assert.Null(result);
    }

    [Fact]
    public async Task InvalidateAllForUserAsync_MarksAllOfThatUsersTokensAsUsed()
    {
        var sut = CreateSut();
        var userId = Guid.NewGuid().ToString();
        var otherUserId = Guid.NewGuid().ToString();
        await sut.SaveTokenAsync(BuildToken(userId, otp: "111111"));
        await sut.SaveTokenAsync(BuildToken(userId, otp: "222222"));
        await sut.SaveTokenAsync(BuildToken(otherUserId, otp: "333333"));

        await sut.InvalidateAllForUserAsync(userId);

        Assert.Null(await sut.GetValidTokenAsync(userId, "111111"));
        Assert.Null(await sut.GetValidTokenAsync(userId, "222222"));
        Assert.NotNull(await sut.GetValidTokenAsync(otherUserId, "333333"));
    }
}
