using Barber.Flow.Application.Services.Reports;
using Barber.Flow.Domain.Entities;
using Barber.Flow.Domain.Interfaces;
using Moq;

namespace Barber.Flow.Application.Tests.Services.Reports;

public class ReportServiceTests
{
    [Fact]
    public async Task GetDailyReportAsync_DelegatesToRepositoryAndReturnsItsResult()
    {
        var repo = new Mock<IReportRepository>();
        var reportDate = new DateOnly(2026, 1, 15);
        var report = new DailyReport
        {
            ReportDate = reportDate,
            TotalCustomersServed = 0,
            GrossRevenue = 0,
            NetProfit = 0,
            CommissionAmount = 0,
            FixedDailyExpense = 0,
            PaymentMethodBreakdown = [],
            CompletedAppointments = [],
            GeneratedAt = DateTime.UtcNow,
        };
        repo.Setup(r => r.GetDailyReportAsync(reportDate, It.IsAny<CancellationToken>())).ReturnsAsync(report);

        var sut = new ReportService(repo.Object);
        var result = await sut.GetDailyReportAsync(reportDate);

        Assert.Same(report, result);
    }
}
