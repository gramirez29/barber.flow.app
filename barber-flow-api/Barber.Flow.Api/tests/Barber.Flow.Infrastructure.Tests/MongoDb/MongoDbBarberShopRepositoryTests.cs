using Barber.Flow.Domain.Entities;
using Barber.Flow.Infrastructure.Services.MongoDb;

namespace Barber.Flow.Infrastructure.Tests.MongoDb;

[Collection(MongoDbCollection.Name)]
public class MongoDbBarberShopRepositoryTests
{
    private readonly MongoDbFixture _fixture;

    public MongoDbBarberShopRepositoryTests(MongoDbFixture fixture) => _fixture = fixture;

    private MongoDbBarberShopRepository CreateSut() => new(_fixture.CreateDatabase());

    private static BarberShop BuildShop(string name = "Main Shop", string createdBy = "admin") => new()
    {
        Name = name,
        Phone = "8888-0000",
        CreatedBy = createdBy,
        UpdatedBy = createdBy,
    };

    [Fact]
    public async Task CreateAsync_GeneratesSequentialIdWithShopPrefix()
    {
        var sut = CreateSut();

        var first = await sut.CreateAsync(BuildShop());
        var second = await sut.CreateAsync(BuildShop());

        Assert.StartsWith("SHOP-", first.Id);
        Assert.NotEqual(first.Id, second.Id);
    }

    [Fact]
    public async Task GetByIdAsync_WrongCreatedBy_ReturnsNull()
    {
        var sut = CreateSut();
        var shop = await sut.CreateAsync(BuildShop(createdBy: "admin"));

        var result = await sut.GetByIdAsync(shop.Id, "someone-else");

        Assert.Null(result);
    }

    [Fact]
    public async Task GetByIdAsync_MatchingCreatedBy_ReturnsShop()
    {
        var sut = CreateSut();
        var shop = await sut.CreateAsync(BuildShop(createdBy: "admin"));

        var result = await sut.GetByIdAsync(shop.Id, "admin");

        Assert.NotNull(result);
        Assert.Equal(shop.Id, result!.Id);
    }

    [Fact]
    public async Task GetAllAsync_OnlyReturnsShopsCreatedByGivenUser()
    {
        var sut = CreateSut();
        await sut.CreateAsync(BuildShop("Shop A", "admin"));
        await sut.CreateAsync(BuildShop("Shop B", "barber1"));

        var result = (await sut.GetAllAsync("admin")).ToList();

        Assert.Single(result);
        Assert.Equal("Shop A", result[0].Name);
    }

    [Fact]
    public async Task UpdateAsync_MatchingIdAndUpdatedBy_UpdatesFields()
    {
        var sut = CreateSut();
        var shop = await sut.CreateAsync(BuildShop(createdBy: "admin"));

        var patch = new BarberShop
        {
            Id = shop.Id,
            Name = "Renamed Shop",
            Phone = "8888-9999",
            UpdatedBy = "admin",
        };
        var updated = await sut.UpdateAsync(patch);

        Assert.Equal("Renamed Shop", updated.Name);
        Assert.Equal("8888-9999", updated.Phone);
    }

    [Fact]
    public async Task UpdateAsync_NotFoundOrUnauthorized_Throws()
    {
        var sut = CreateSut();
        var patch = new BarberShop { Id = "SHOP-9999", Name = "Ghost", UpdatedBy = "admin" };

        await Assert.ThrowsAsync<InvalidOperationException>(() => sut.UpdateAsync(patch));
    }

    [Fact]
    public async Task DeleteAsync_WrongCreatedBy_ReturnsFalseAndDoesNotDelete()
    {
        var sut = CreateSut();
        var shop = await sut.CreateAsync(BuildShop(createdBy: "admin"));

        var deleted = await sut.DeleteAsync(shop.Id, "someone-else");

        Assert.False(deleted);
        Assert.NotNull(await sut.GetByIdAsync(shop.Id, "admin"));
    }

    [Fact]
    public async Task DeleteAsync_MatchingCreatedBy_RemovesShop()
    {
        var sut = CreateSut();
        var shop = await sut.CreateAsync(BuildShop(createdBy: "admin"));

        var deleted = await sut.DeleteAsync(shop.Id, "admin");

        Assert.True(deleted);
        Assert.Null(await sut.GetByIdAsync(shop.Id, "admin"));
    }
}
