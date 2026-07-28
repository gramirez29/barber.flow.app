using Barber.Flow.Application.Services.Clients;
using Barber.Flow.Domain.Entities;
using Barber.Flow.Domain.Interfaces;
using Moq;

namespace Barber.Flow.Application.Tests.Services.Clients;

public class ClientServiceTests
{
    private readonly Mock<IClientRepository> _repo = new();

    private ClientService CreateSut() => new(_repo.Object);

    [Fact]
    public async Task CreateAsync_DelegatesToRepositoryAndReturnsItsResult()
    {
        var client = new Client { FirstName = "Juan", LastName = "Perez" };
        var created = new Client { Id = "1", FirstName = "Juan", LastName = "Perez" };
        _repo.Setup(r => r.CreateAsync(client, It.IsAny<CancellationToken>())).ReturnsAsync(created);

        var result = await CreateSut().CreateAsync(client);

        Assert.Same(created, result);
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
    public async Task UpdateAsync_DelegatesToRepositoryAndReturnsItsResult()
    {
        var client = new Client { FirstName = "Juan" };
        var updated = new Client { Id = "1", FirstName = "Juan" };
        _repo.Setup(r => r.UpdateAsync("1", client, It.IsAny<CancellationToken>())).ReturnsAsync(updated);

        var result = await CreateSut().UpdateAsync("1", client);

        Assert.Same(updated, result);
    }
}
