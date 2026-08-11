using Barber.Flow.Application.Services.Barbers;
using Barber.Flow.Domain.Entities;
using Barber.Flow.Domain.Interfaces;
using Moq;
using BarberEntity = Barber.Flow.Domain.Entities.Barber;

namespace Barber.Flow.Application.Tests.Services.Barbers;

public class BarberServiceTests
{
    private readonly Mock<IBarberRepository> _repo = new();
    private readonly Mock<IBarberShopRepository> _shopRepo = new();

    private BarberService CreateSut() => new(_repo.Object, _shopRepo.Object);

    [Fact]
    public async Task CreateAsync_WithoutShopName_StillCreatesShopUsingBarberNameAndLinksShopId()
    {
        // Every barber must always end up with a ShopId - it's the tenant boundary used to
        // isolate each barber's appointments/clients from every other barber's.
        var barber = new BarberEntity { BarberName = "Main Barber", CreatedBy = "admin" };
        var createdShop = new BarberShop { Id = "SHOP-0001", Name = "Main Barber", CreatedBy = "admin", UpdatedBy = "admin" };
        _shopRepo.Setup(s => s.CreateAsync(It.Is<BarberShop>(bs => bs.Name == "Main Barber" && bs.CreatedBy == "admin")))
            .ReturnsAsync(createdShop);
        _repo.Setup(r => r.CreateAsync(It.IsAny<BarberEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((BarberEntity b, CancellationToken _) => b);

        var result = await CreateSut().CreateAsync(barber);

        Assert.Equal("SHOP-0001", result.ShopId);
        _repo.Verify(r => r.CreateAsync(It.Is<BarberEntity>(b => b.ShopId == "SHOP-0001"), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_WithShopName_CreatesShopAndLinksShopIdOnBarber()
    {
        var barber = new BarberEntity
        {
            BarberName = "Main Barber",
            BarberShopName = "Downtown Barbershop",
            BarberShopPhone = "8888-1111",
            Address = "Main Street 1",
            CreatedBy = "admin",
        };
        var createdShop = new BarberShop { Id = "SHOP-0001", Name = "Downtown Barbershop", Phone = "8888-1111", Address = "Main Street 1", CreatedBy = "admin", UpdatedBy = "admin" };
        _shopRepo.Setup(s => s.CreateAsync(It.Is<BarberShop>(bs =>
            bs.Name == "Downtown Barbershop" && bs.Phone == "8888-1111" && bs.Address == "Main Street 1" && bs.CreatedBy == "admin")))
            .ReturnsAsync(createdShop);
        _repo.Setup(r => r.CreateAsync(It.IsAny<BarberEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((BarberEntity b, CancellationToken _) => b);

        var result = await CreateSut().CreateAsync(barber);

        Assert.Equal("SHOP-0001", result.ShopId);
        _repo.Verify(r => r.CreateAsync(It.Is<BarberEntity>(b => b.ShopId == "SHOP-0001"), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_DelegatesToRepositoryAndReturnsItsResult()
    {
        _repo.Setup(r => r.DeleteAsync("CRB-0001", It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var result = await CreateSut().DeleteAsync("CRB-0001");

        Assert.True(result);
    }

    [Fact]
    public async Task FindAsync_PropagatesQueryAndPaginationToRepository()
    {
        var expected = new List<BarberEntity> { new() { Id = "CRB-0001" } };
        _repo.Setup(r => r.FindAsync("Main", 1, 20, It.IsAny<CancellationToken>())).ReturnsAsync(expected);

        var result = await CreateSut().FindAsync("Main", 1, 20);

        Assert.Same(expected, result);
    }

    [Fact]
    public async Task GetByIdAsync_BarberNotFound_ReturnsNull()
    {
        _repo.Setup(r => r.GetByIdAsync("missing", It.IsAny<CancellationToken>())).ReturnsAsync((BarberEntity?)null);

        var result = await CreateSut().GetByIdAsync("missing");

        Assert.Null(result);
    }

    [Fact]
    public async Task UpdateAsync_BarberNotFound_ReturnsNullWithoutTouchingShops()
    {
        var barber = new BarberEntity { BarberName = "Main Barber" };
        _repo.Setup(r => r.GetByIdAsync("missing", It.IsAny<CancellationToken>())).ReturnsAsync((BarberEntity?)null);

        var result = await CreateSut().UpdateAsync("missing", barber);

        Assert.Null(result);
        _shopRepo.Verify(s => s.CreateAsync(It.IsAny<BarberShop>()), Times.Never);
        _shopRepo.Verify(s => s.UpdateAsync(It.IsAny<BarberShop>()), Times.Never);
    }

    [Fact]
    public async Task UpdateAsync_WithoutShopName_PreservesExistingShopIdWithoutSyncingShop()
    {
        var barber = new BarberEntity { BarberName = "Main Barber" };
        var existing = new BarberEntity { Id = "CRB-0001", ShopId = "SHOP-0001", CreatedBy = "admin" };
        var updated = new BarberEntity { Id = "CRB-0001", BarberName = "Main Barber", ShopId = "SHOP-0001" };
        _repo.Setup(r => r.GetByIdAsync("CRB-0001", It.IsAny<CancellationToken>())).ReturnsAsync(existing);
        _repo.Setup(r => r.UpdateAsync("CRB-0001", It.Is<BarberEntity>(b => b.ShopId == "SHOP-0001"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(updated);

        var result = await CreateSut().UpdateAsync("CRB-0001", barber);

        Assert.Same(updated, result);
        _shopRepo.Verify(s => s.CreateAsync(It.IsAny<BarberShop>()), Times.Never);
        _shopRepo.Verify(s => s.UpdateAsync(It.IsAny<BarberShop>()), Times.Never);
    }

    [Fact]
    public async Task UpdateAsync_WithShopNameAndExistingShopId_UpdatesLinkedShop()
    {
        var barber = new BarberEntity { BarberName = "Main Barber", BarberShopName = "Renamed Shop", BarberShopPhone = "8888-2222", Address = "New Address" };
        var existing = new BarberEntity { Id = "CRB-0001", ShopId = "SHOP-0001", CreatedBy = "admin" };
        var updatedShop = new BarberShop { Id = "SHOP-0001", Name = "Renamed Shop", Phone = "8888-2222", Address = "New Address", CreatedBy = "admin", UpdatedBy = "admin" };
        var updatedBarber = new BarberEntity { Id = "CRB-0001", ShopId = "SHOP-0001" };
        _repo.Setup(r => r.GetByIdAsync("CRB-0001", It.IsAny<CancellationToken>())).ReturnsAsync(existing);
        _shopRepo.Setup(s => s.UpdateAsync(It.Is<BarberShop>(bs =>
            bs.Id == "SHOP-0001" && bs.Name == "Renamed Shop" && bs.CreatedBy == "admin" && bs.UpdatedBy == "admin")))
            .ReturnsAsync(updatedShop);
        _repo.Setup(r => r.UpdateAsync("CRB-0001", It.Is<BarberEntity>(b => b.ShopId == "SHOP-0001"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(updatedBarber);

        var result = await CreateSut().UpdateAsync("CRB-0001", barber);

        Assert.Same(updatedBarber, result);
        _shopRepo.Verify(s => s.CreateAsync(It.IsAny<BarberShop>()), Times.Never);
    }

    [Fact]
    public async Task UpdateAsync_WithShopNameAndNoExistingShopId_CreatesShopAndLinksIt()
    {
        var barber = new BarberEntity { BarberName = "Main Barber", BarberShopName = "First Shop", BarberShopPhone = "8888-3333", Address = "Some Address" };
        var existing = new BarberEntity { Id = "CRB-0001", ShopId = null, CreatedBy = "admin" };
        var createdShop = new BarberShop { Id = "SHOP-0002", Name = "First Shop", Phone = "8888-3333", Address = "Some Address", CreatedBy = "admin", UpdatedBy = "admin" };
        var updatedBarber = new BarberEntity { Id = "CRB-0001", ShopId = "SHOP-0002" };
        _repo.Setup(r => r.GetByIdAsync("CRB-0001", It.IsAny<CancellationToken>())).ReturnsAsync(existing);
        _shopRepo.Setup(s => s.CreateAsync(It.Is<BarberShop>(bs => bs.Name == "First Shop" && bs.CreatedBy == "admin")))
            .ReturnsAsync(createdShop);
        _repo.Setup(r => r.UpdateAsync("CRB-0001", It.Is<BarberEntity>(b => b.ShopId == "SHOP-0002"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(updatedBarber);

        var result = await CreateSut().UpdateAsync("CRB-0001", barber);

        Assert.Same(updatedBarber, result);
        _shopRepo.Verify(s => s.UpdateAsync(It.IsAny<BarberShop>()), Times.Never);
    }

    [Fact]
    public async Task GetNextIdAsync_DelegatesToRepositoryAndReturnsItsResult()
    {
        _repo.Setup(r => r.GetNextIdAsync(It.IsAny<CancellationToken>())).ReturnsAsync("CRB-0007");

        var result = await CreateSut().GetNextIdAsync();

        Assert.Equal("CRB-0007", result);
    }
}
