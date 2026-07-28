using Barber.Flow.Domain.Entities;
using Barber.Flow.Infrastructure.Services.InMemory;

namespace Barber.Flow.Infrastructure.Tests.InMemory;

public class InMemoryBarberShopRepositoryTests
{
    private static BarberShop BuildShop(string name = "Test Shop", string createdBy = "test-user") => new()
    {
        Name = name,
        Phone = "8888-0000",
        CreatedBy = createdBy,
        UpdatedBy = createdBy,
    };

    [Fact]
    public async Task CreateAsync_GeneratesSequentialIdWithShopPrefix()
    {
        var repo = new InMemoryBarberShopRepository();

        var first = await repo.CreateAsync(BuildShop());
        var second = await repo.CreateAsync(BuildShop());

        Assert.StartsWith("SHOP-", first.Id);
        Assert.NotEqual(first.Id, second.Id);
    }

    [Fact]
    public async Task GetByIdAsync_WrongCreatedBy_ReturnsNull()
    {
        var repo = new InMemoryBarberShopRepository();
        var shop = await repo.CreateAsync(BuildShop(createdBy: "owner-a"));

        var result = await repo.GetByIdAsync(shop.Id, "owner-b");

        Assert.Null(result);
    }

    [Fact]
    public async Task GetAllAsync_OnlyReturnsShopsCreatedByGivenUser()
    {
        var repo = new InMemoryBarberShopRepository();
        await repo.CreateAsync(BuildShop("Shop A", "owner-a"));
        await repo.CreateAsync(BuildShop("Shop B", "owner-b"));

        var result = (await repo.GetAllAsync("owner-a")).ToList();

        Assert.Contains(result, s => s.Name == "Shop A");
        Assert.DoesNotContain(result, s => s.Name == "Shop B");
    }

    [Fact]
    public async Task UpdateAsync_MatchingCreatedBy_UpdatesFields()
    {
        var repo = new InMemoryBarberShopRepository();
        var shop = await repo.CreateAsync(BuildShop(createdBy: "owner-a"));

        var updated = await repo.UpdateAsync(new BarberShop
        {
            Id = shop.Id,
            Name = "Renamed Shop",
            Phone = "8888-9999",
            UpdatedBy = "owner-a",
        });

        Assert.Equal("Renamed Shop", updated.Name);
    }

    [Fact]
    public async Task UpdateAsync_NotFoundOrUnauthorized_Throws()
    {
        var repo = new InMemoryBarberShopRepository();
        var shop = await repo.CreateAsync(BuildShop(createdBy: "owner-a"));

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            repo.UpdateAsync(new BarberShop { Id = shop.Id, Name = "Hacked", UpdatedBy = "owner-b" }));
    }

    [Fact]
    public async Task DeleteAsync_WrongCreatedBy_ReturnsFalse()
    {
        var repo = new InMemoryBarberShopRepository();
        var shop = await repo.CreateAsync(BuildShop(createdBy: "owner-a"));

        var deleted = await repo.DeleteAsync(shop.Id, "owner-b");

        Assert.False(deleted);
    }

    [Fact]
    public async Task DeleteAsync_MatchingCreatedBy_RemovesShop()
    {
        var repo = new InMemoryBarberShopRepository();
        var shop = await repo.CreateAsync(BuildShop(createdBy: "owner-a"));

        var deleted = await repo.DeleteAsync(shop.Id, "owner-a");

        Assert.True(deleted);
        Assert.Null(await repo.GetByIdAsync(shop.Id, "owner-a"));
    }
}
