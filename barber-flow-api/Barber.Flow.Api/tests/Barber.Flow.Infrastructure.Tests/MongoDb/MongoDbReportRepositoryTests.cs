using Barber.Flow.Domain.Interfaces;
using Barber.Flow.Infrastructure.Services.MongoDb;
using Moq;
using BarberEntity = Barber.Flow.Domain.Entities.Barber;

namespace Barber.Flow.Infrastructure.Tests.MongoDb;

public class MongoDbReportRepositoryTests
{
    private readonly Mock<IAppointmentRepository> _appointmentRepository = new();
    private readonly Mock<IBarberRepository> _barberRepository = new();

    private MongoDbReportRepository CreateSut() => new(_appointmentRepository.Object, _barberRepository.Object);

    [Fact]
    public async Task GetDailyReportAsync_RequestingBarberIsLinked_FiltersAppointmentsByCreatedBy()
    {
        var reportDate = new DateOnly(2026, 8, 19);
        var barber = new BarberEntity { UserName = "barber1", ShopId = "SHOP-0001" };
        _barberRepository.Setup(r => r.GetByUserNameAsync("barber1", It.IsAny<CancellationToken>())).ReturnsAsync(barber);
        _appointmentRepository
            .Setup(r => r.FindAsync("2026-08-19", "2026-08-19", "completed", null, null, null, null, "barber1", It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        await CreateSut().GetDailyReportAsync(reportDate, "barber1");

        _appointmentRepository.Verify(
            r => r.FindAsync("2026-08-19", "2026-08-19", "completed", null, null, null, null, "barber1", It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task GetDailyReportAsync_NoLinkedBarber_DoesNotFilterByCreatedBy()
    {
        var reportDate = new DateOnly(2026, 8, 19);
        _barberRepository.Setup(r => r.GetByUserNameAsync("admin", It.IsAny<CancellationToken>())).ReturnsAsync((BarberEntity?)null);
        _appointmentRepository
            .Setup(r => r.FindAsync("2026-08-19", "2026-08-19", "completed", null, null, null, null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        await CreateSut().GetDailyReportAsync(reportDate, "admin");

        _appointmentRepository.Verify(
            r => r.FindAsync("2026-08-19", "2026-08-19", "completed", null, null, null, null, null, It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
