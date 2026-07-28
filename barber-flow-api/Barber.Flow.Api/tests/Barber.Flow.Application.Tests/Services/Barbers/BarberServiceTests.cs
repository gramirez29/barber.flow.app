using Barber.Flow.Application.Services.Barbers;
using Barber.Flow.Domain.Interfaces;
using Moq;
using BarberEntity = Barber.Flow.Domain.Entities.Barber;

namespace Barber.Flow.Application.Tests.Services.Barbers;

public class BarberServiceTests
{
    private readonly Mock<IBarberRepository> _repo = new();

    private BarberService CreateSut() => new(_repo.Object);

    [Fact]
    public async Task CreateAsync_DelegatesToRepositoryAndReturnsItsResult()
    {
        var barber = new BarberEntity { BarberName = "Main Barber" };
        var created = new BarberEntity { Id = "CRB-0001", BarberName = "Main Barber" };
        _repo.Setup(r => r.CreateAsync(barber, It.IsAny<CancellationToken>())).ReturnsAsync(created);

        var result = await CreateSut().CreateAsync(barber);

        Assert.Same(created, result);
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
    public async Task UpdateAsync_DelegatesToRepositoryAndReturnsItsResult()
    {
        var barber = new BarberEntity { BarberName = "Main Barber" };
        var updated = new BarberEntity { Id = "CRB-0001", BarberName = "Main Barber" };
        _repo.Setup(r => r.UpdateAsync("CRB-0001", barber, It.IsAny<CancellationToken>())).ReturnsAsync(updated);

        var result = await CreateSut().UpdateAsync("CRB-0001", barber);

        Assert.Same(updated, result);
    }

    [Fact]
    public async Task GetNextIdAsync_DelegatesToRepositoryAndReturnsItsResult()
    {
        _repo.Setup(r => r.GetNextIdAsync(It.IsAny<CancellationToken>())).ReturnsAsync("CRB-0007");

        var result = await CreateSut().GetNextIdAsync();

        Assert.Equal("CRB-0007", result);
    }
}
