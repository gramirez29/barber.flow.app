using Barber.Flow.Application.Services.Appointments;
using Barber.Flow.Domain.Entities;
using Barber.Flow.Domain.Interfaces;
using Moq;
using BarberEntity = Barber.Flow.Domain.Entities.Barber;

namespace Barber.Flow.Application.Tests.Services.AppointmentsFeature;

public class AppointmentServiceTests
{
    private readonly Mock<IAppointmentRepository> _repo = new();
    private readonly Mock<IBarberRepository> _barberRepo = new();

    private AppointmentService CreateSut() => new(_repo.Object, _barberRepo.Object);

    [Fact]
    public async Task CreateAsync_WithoutCreatedBy_DelegatesToRepositoryWithoutResolvingShop()
    {
        var appointment = new Appointments { ClientName = "Juan" };
        var created = new Appointments { Id = "APT-0001", ClientName = "Juan" };
        _repo.Setup(r => r.CreateAsync(appointment, It.IsAny<CancellationToken>())).ReturnsAsync(created);

        var result = await CreateSut().CreateAsync(appointment);

        Assert.Same(created, result);
        _barberRepo.Verify(b => b.GetByUserNameAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_WithCreatedBy_ResolvesShopIdFromCreatingBarber()
    {
        var appointment = new Appointments { ClientName = "Juan", CreatedBy = "barber1" };
        var barber = new BarberEntity { UserName = "barber1", ShopId = "SHOP-0001" };
        _barberRepo.Setup(b => b.GetByUserNameAsync("barber1", It.IsAny<CancellationToken>())).ReturnsAsync(barber);
        _repo.Setup(r => r.CreateAsync(It.IsAny<Appointments>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Appointments a, CancellationToken _) => a);

        var result = await CreateSut().CreateAsync(appointment);

        Assert.Equal("SHOP-0001", result.ShopId);
    }

    [Fact]
    public async Task CreateAsync_CreatingBarberHasNoShop_LeavesShopIdNull()
    {
        var appointment = new Appointments { ClientName = "Juan", CreatedBy = "barber1" };
        _barberRepo.Setup(b => b.GetByUserNameAsync("barber1", It.IsAny<CancellationToken>())).ReturnsAsync((BarberEntity?)null);
        _repo.Setup(r => r.CreateAsync(It.IsAny<Appointments>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Appointments a, CancellationToken _) => a);

        var result = await CreateSut().CreateAsync(appointment);

        Assert.Null(result.ShopId);
    }

    [Fact]
    public async Task CreateAsync_ExplicitShopIdAlreadySet_DoesNotOverrideIt()
    {
        var appointment = new Appointments { ClientName = "Juan", CreatedBy = "barber1", ShopId = "SHOP-0002" };
        _repo.Setup(r => r.CreateAsync(It.IsAny<Appointments>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Appointments a, CancellationToken _) => a);

        var result = await CreateSut().CreateAsync(appointment);

        Assert.Equal("SHOP-0002", result.ShopId);
        _barberRepo.Verify(b => b.GetByUserNameAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task UpdateAsync_AppointmentNotFound_ReturnsNull()
    {
        var appointment = new Appointments { ClientName = "Juan" };
        _repo.Setup(r => r.GetByIdAsync("missing-id", It.IsAny<CancellationToken>())).ReturnsAsync((Appointments?)null);

        var result = await CreateSut().UpdateAsync("missing-id", appointment);

        Assert.Null(result);
        _repo.Verify(r => r.UpdateAsync(It.IsAny<string>(), It.IsAny<Appointments>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task UpdateAsync_PreservesShopIdFromExistingAppointment()
    {
        var appointment = new Appointments { ClientName = "Juan Updated", UpdatedBy = "admin" };
        var existing = new Appointments { Id = "APT-0001", ShopId = "SHOP-0001" };
        var updated = new Appointments { Id = "APT-0001", ClientName = "Juan Updated", ShopId = "SHOP-0001" };
        _repo.Setup(r => r.GetByIdAsync("APT-0001", It.IsAny<CancellationToken>())).ReturnsAsync(existing);
        _repo.Setup(r => r.UpdateAsync("APT-0001", It.Is<Appointments>(a => a.ShopId == "SHOP-0001"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(updated);

        var result = await CreateSut().UpdateAsync("APT-0001", appointment);

        Assert.Same(updated, result);
    }

    [Fact]
    public async Task DeleteAsync_DelegatesToRepositoryAndReturnsItsResult()
    {
        _repo.Setup(r => r.DeleteAsync("APT-0001", It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var result = await CreateSut().DeleteAsync("APT-0001");

        Assert.True(result);
    }

    [Fact]
    public async Task GetByIdAsync_DelegatesToRepositoryAndReturnsItsResult()
    {
        var appointment = new Appointments { Id = "APT-0001" };
        _repo.Setup(r => r.GetByIdAsync("APT-0001", It.IsAny<CancellationToken>())).ReturnsAsync(appointment);

        var result = await CreateSut().GetByIdAsync("APT-0001");

        Assert.Same(appointment, result);
    }

    [Fact]
    public async Task FindAsync_PropagatesAllFilterArgumentsToRepository()
    {
        var expected = new List<Appointments> { new() { Id = "APT-0001" } };
        _repo.Setup(r => r.FindAsync("2026-01-01", "2026-01-31", "completed", "Juan", 2, 10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        var result = await CreateSut().FindAsync("2026-01-01", "2026-01-31", "completed", "Juan", 2, 10);

        Assert.Same(expected, result);
        _repo.VerifyAll();
    }

    [Fact]
    public async Task MoveAsync_DelegatesToRepositoryAndReturnsItsResult()
    {
        var moved = new Appointments { Id = "APT-0001", Date = "2026-02-01" };
        _repo.Setup(r => r.MoveAsync("APT-0001", "2026-02-01", It.IsAny<CancellationToken>())).ReturnsAsync(moved);

        var result = await CreateSut().MoveAsync("APT-0001", "2026-02-01");

        Assert.Same(moved, result);
    }

    [Fact]
    public async Task GetNextIdAsync_DelegatesToRepositoryAndReturnsItsResult()
    {
        _repo.Setup(r => r.GetNextIdAsync(It.IsAny<CancellationToken>())).ReturnsAsync("APT-0042");

        var result = await CreateSut().GetNextIdAsync();

        Assert.Equal("APT-0042", result);
    }
}
