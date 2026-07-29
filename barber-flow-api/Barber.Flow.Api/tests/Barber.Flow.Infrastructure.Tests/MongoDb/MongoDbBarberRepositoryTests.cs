using Barber.Flow.Domain.ValueObjects;
using Barber.Flow.Infrastructure.Services.MongoDb;
using BarberEntity = Barber.Flow.Domain.Entities.Barber;

namespace Barber.Flow.Infrastructure.Tests.MongoDb;

[Collection(MongoDbCollection.Name)]
public class MongoDbBarberRepositoryTests
{
    private readonly MongoDbFixture _fixture;

    public MongoDbBarberRepositoryTests(MongoDbFixture fixture) => _fixture = fixture;

    private MongoDbBarberRepository CreateSut() => new(_fixture.CreateDatabase());

    private static BarberEntity BuildBarber(string userName = "Main Barber", string barberName = "Main Barber", string email = "barber@example.com") => new()
    {
        UserName = userName,
        UserPhone = "8888-0000",
        UserEmail = email,
        BarberName = barberName,
        BarberPhone = "8888-0000",
        Settings = new BarberSettings(CommissionPercentage: 40m, FixedDailyExpense: 12000m),
    };

    [Fact]
    public async Task CreateAsync_WithoutId_GeneratesSequentialIdWithCrbPrefix()
    {
        var sut = CreateSut();

        var first = await sut.CreateAsync(BuildBarber());
        var second = await sut.CreateAsync(BuildBarber());

        Assert.StartsWith("CRB-", first.Id);
        Assert.NotEqual(first.Id, second.Id);
    }

    [Fact]
    public async Task GetNextIdAsync_PeekDoesNotAdvanceCounter_CreateUsesSameId()
    {
        var sut = CreateSut();

        var peeked = await sut.GetNextIdAsync();
        var created = await sut.CreateAsync(BuildBarber());

        Assert.Equal(peeked, created.Id);
    }

    [Fact]
    public async Task UpdateAsync_PreservesSettingsAndOnlyChangesMappedFields()
    {
        var sut = CreateSut();
        var barber = await sut.CreateAsync(BuildBarber());

        var patch = new BarberEntity
        {
            UserName = "Renamed Barber",
            UserPhone = barber.UserPhone,
            UserEmail = barber.UserEmail,
            BarberName = barber.BarberName,
            BarberPhone = barber.BarberPhone,
            Settings = new BarberSettings(CommissionPercentage: 50m, FixedDailyExpense: 15000m),
        };

        var updated = await sut.UpdateAsync(barber.Id, patch);

        Assert.NotNull(updated);
        Assert.Equal("Renamed Barber", updated!.UserName);
        Assert.Equal(50m, updated.Settings!.CommissionPercentage);
    }

    [Fact]
    public async Task UpdateAsync_SetsShopId()
    {
        var sut = CreateSut();
        var barber = await sut.CreateAsync(BuildBarber());

        var patch = new BarberEntity
        {
            UserName = barber.UserName,
            UserPhone = barber.UserPhone,
            UserEmail = barber.UserEmail,
            BarberName = barber.BarberName,
            BarberPhone = barber.BarberPhone,
            ShopId = "SHOP-0001",
        };

        var updated = await sut.UpdateAsync(barber.Id, patch);

        Assert.NotNull(updated);
        Assert.Equal("SHOP-0001", updated!.ShopId);
    }

    [Fact]
    public async Task UpdateAsync_BarberNotFound_ReturnsNull()
    {
        var sut = CreateSut();

        var result = await sut.UpdateAsync("CRB-9999", BuildBarber());

        Assert.Null(result);
    }

    [Fact]
    public async Task GetByUserNameAsync_MatchingUserNameCaseInsensitive_ReturnsBarber()
    {
        var sut = CreateSut();
        var barber = await sut.CreateAsync(BuildBarber(userName: "Barber1"));

        var result = await sut.GetByUserNameAsync("barber1");

        Assert.NotNull(result);
        Assert.Equal(barber.Id, result!.Id);
    }

    [Fact]
    public async Task GetByUserNameAsync_NoMatch_ReturnsNull()
    {
        var sut = CreateSut();

        var result = await sut.GetByUserNameAsync("missing-user");

        Assert.Null(result);
    }

    [Fact]
    public async Task DeleteAsync_ExistingBarber_RemovesItAndReturnsTrue()
    {
        var sut = CreateSut();
        var barber = await sut.CreateAsync(BuildBarber());

        var deleted = await sut.DeleteAsync(barber.Id);

        Assert.True(deleted);
        Assert.Null(await sut.GetByIdAsync(barber.Id));
    }

    [Fact]
    public async Task DeleteAsync_BarberNotFound_ReturnsFalse()
    {
        var sut = CreateSut();

        var deleted = await sut.DeleteAsync("CRB-9999");

        Assert.False(deleted);
    }

    [Fact]
    public async Task FindAsync_QueryMatchesUserNameBarberNameOrEmail()
    {
        var sut = CreateSut();
        await sut.CreateAsync(BuildBarber("Juan Barber", "Juan", "juan@example.com"));
        await sut.CreateAsync(BuildBarber("Maria Barber", "Maria", "maria@example.com"));

        var byBarberName = await sut.FindAsync("maria");
        var byEmail = await sut.FindAsync("juan@example.com");
        var byNoMatch = await sut.FindAsync("no-such-barber");

        Assert.Single(byBarberName);
        Assert.Equal("Maria", byBarberName.First().BarberName);
        Assert.Single(byEmail);
        Assert.Equal("Juan", byEmail.First().BarberName);
        Assert.Empty(byNoMatch);
    }
}
