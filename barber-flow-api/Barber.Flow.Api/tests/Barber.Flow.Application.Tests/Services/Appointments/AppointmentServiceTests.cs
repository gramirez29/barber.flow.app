using Barber.Flow.Application.Services.Appointments;
using Barber.Flow.Domain.Entities;
using Barber.Flow.Domain.Interfaces;
using Moq;

namespace Barber.Flow.Application.Tests.Services.AppointmentsFeature;

public class AppointmentServiceTests
{
    private readonly Mock<IAppointmentRepository> _repo = new();

    private AppointmentService CreateSut() => new(_repo.Object);

    [Fact]
    public async Task CreateAsync_DelegatesToRepositoryAndReturnsItsResult()
    {
        var appointment = new Appointments { ClientName = "Juan" };
        var created = new Appointments { Id = "APT-0001", ClientName = "Juan" };
        _repo.Setup(r => r.CreateAsync(appointment, It.IsAny<CancellationToken>())).ReturnsAsync(created);

        var result = await CreateSut().CreateAsync(appointment);

        Assert.Same(created, result);
    }

    [Fact]
    public async Task UpdateAsync_AppointmentNotFound_ReturnsNull()
    {
        var appointment = new Appointments { ClientName = "Juan" };
        _repo.Setup(r => r.UpdateAsync("missing-id", appointment, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Appointments?)null);

        var result = await CreateSut().UpdateAsync("missing-id", appointment);

        Assert.Null(result);
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
