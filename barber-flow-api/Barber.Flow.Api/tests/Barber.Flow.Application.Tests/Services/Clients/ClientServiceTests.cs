using Barber.Flow.Application.Services.Clients;
using Barber.Flow.Domain.Entities;
using Barber.Flow.Domain.Interfaces;
using Moq;
using BarberEntity = Barber.Flow.Domain.Entities.Barber;

namespace Barber.Flow.Application.Tests.Services.Clients;

public class ClientServiceTests
{
    private readonly Mock<IClientRepository> _repo = new();
    private readonly Mock<IBarberRepository> _barberRepo = new();

    private ClientService CreateSut() => new(_repo.Object, _barberRepo.Object);

    [Fact]
    public async Task CreateAsync_WithoutCreatedBy_DelegatesToRepositoryWithoutResolvingShop()
    {
        var client = new Client { FirstName = "Juan", LastName = "Perez" };
        var created = new Client { Id = "1", FirstName = "Juan", LastName = "Perez" };
        _repo.Setup(r => r.CreateAsync(client, It.IsAny<CancellationToken>())).ReturnsAsync(created);

        var result = await CreateSut().CreateAsync(client);

        Assert.Same(created, result);
        _barberRepo.Verify(b => b.GetByUserNameAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_WithCreatedBy_ResolvesShopIdFromCreatingBarber()
    {
        var client = new Client { FirstName = "Juan", CreatedBy = "barber1" };
        var barber = new BarberEntity { UserName = "barber1", ShopId = "SHOP-0001" };
        _barberRepo.Setup(b => b.GetByUserNameAsync("barber1", It.IsAny<CancellationToken>())).ReturnsAsync(barber);
        _repo.Setup(r => r.CreateAsync(It.IsAny<Client>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Client c, CancellationToken _) => c);

        var result = await CreateSut().CreateAsync(client);

        Assert.Equal("SHOP-0001", result.ShopId);
    }

    [Fact]
    public async Task CreateAsync_ExplicitShopIdAlreadySet_DoesNotOverrideIt()
    {
        var client = new Client { FirstName = "Juan", CreatedBy = "barber1", ShopId = "SHOP-0002" };
        _repo.Setup(r => r.CreateAsync(It.IsAny<Client>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Client c, CancellationToken _) => c);

        var result = await CreateSut().CreateAsync(client);

        Assert.Equal("SHOP-0002", result.ShopId);
        _barberRepo.Verify(b => b.GetByUserNameAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DeleteAsync_DelegatesToRepositoryAndReturnsItsResult()
    {
        _repo.Setup(r => r.DeleteAsync("1", It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var result = await CreateSut().DeleteAsync("1");

        Assert.True(result);
    }

    [Fact]
    public async Task FindAsync_PropagatesQueryAndPaginationToRepository()
    {
        var expected = new List<Client> { new() { Id = "1" } };
        _repo.Setup(r => r.FindAsync("Juan", 2, 10, It.IsAny<CancellationToken>())).ReturnsAsync(expected);

        var result = await CreateSut().FindAsync("Juan", 2, 10);

        Assert.Same(expected, result);
    }

    [Fact]
    public async Task GetByIdAsync_ClientNotFound_ReturnsNull()
    {
        _repo.Setup(r => r.GetByIdAsync("missing", It.IsAny<CancellationToken>())).ReturnsAsync((Client?)null);

        var result = await CreateSut().GetByIdAsync("missing");

        Assert.Null(result);
    }

    [Fact]
    public async Task UpdateAsync_ClientNotFound_ReturnsNull()
    {
        var client = new Client { FirstName = "Juan" };
        _repo.Setup(r => r.GetByIdAsync("missing", It.IsAny<CancellationToken>())).ReturnsAsync((Client?)null);

        var result = await CreateSut().UpdateAsync("missing", client);

        Assert.Null(result);
        _repo.Verify(r => r.UpdateAsync(It.IsAny<string>(), It.IsAny<Client>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task UpdateAsync_PreservesShopIdFromExistingClient()
    {
        var client = new Client { FirstName = "Juan Updated" };
        var existing = new Client { Id = "1", ShopId = "SHOP-0001" };
        var updated = new Client { Id = "1", FirstName = "Juan Updated", ShopId = "SHOP-0001" };
        _repo.Setup(r => r.GetByIdAsync("1", It.IsAny<CancellationToken>())).ReturnsAsync(existing);
        _repo.Setup(r => r.UpdateAsync("1", It.Is<Client>(c => c.ShopId == "SHOP-0001"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(updated);

        var result = await CreateSut().UpdateAsync("1", client);

        Assert.Same(updated, result);
    }
}
