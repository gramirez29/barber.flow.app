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
        repo.Setup(r => r.GetDailyReportAsync(reportDate, It.IsAny<string?>(), It.IsAny<CancellationToken>())).ReturnsAsync(report);

        var sut = new ReportService(repo.Object, TimeProvider.System);
        var result = await sut.GetDailyReportAsync(reportDate);

        Assert.Same(report, result);
    }

    // The clock the service sees, fixed to an instant so "today" is deterministic.
    private sealed class FixedTimeProvider(DateTimeOffset utcNow) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => utcNow;
    }

    private static PeriodReport EmptyPeriodReport(string periodType, DateOnly from, DateOnly to) => new()
    {
        PeriodType = periodType,
        From = from,
        To = to,
        CountedDays = 0,
        TotalCustomersServed = 0,
        GrossRevenue = 0,
        CommissionAmount = 0,
        FixedDailyExpense = 0,
        FixedExpenseTotal = 0,
        NetProfit = 0,
        PaymentMethodBreakdown = [],
        Days = [],
        GeneratedAt = DateTime.UtcNow,
    };

    private static ReportService CreateSut(Mock<IReportRepository> repo, string utcNow) =>
        new(repo.Object, new FixedTimeProvider(DateTimeOffset.Parse(utcNow)));

    [Fact]
    public async Task GetWeeklyReportAsync_WithAnchor_AsksForTheSundayToSaturdayWeek()
    {
        var repo = new Mock<IReportRepository>();
        var report = EmptyPeriodReport("weekly", new DateOnly(2026, 11, 15), new DateOnly(2026, 11, 21));
        repo.Setup(r => r.GetPeriodReportAsync("weekly", new DateOnly(2026, 11, 15), new DateOnly(2026, 11, 21), new DateOnly(2026, 11, 20), "barber1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(report);

        var result = await CreateSut(repo, "2026-11-20T15:00:00+00:00").GetWeeklyReportAsync(new DateOnly(2026, 11, 18), "barber1");

        Assert.Same(report, result);
    }

    [Fact]
    public async Task GetWeeklyReportAsync_WithoutAnchor_UsesTheCurrentWeekInCostaRica()
    {
        var repo = new Mock<IReportRepository>();
        repo.Setup(r => r.GetPeriodReportAsync(It.IsAny<string>(), It.IsAny<DateOnly>(), It.IsAny<DateOnly>(), It.IsAny<DateOnly>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(EmptyPeriodReport("weekly", default, default));

        // 2026-11-22 02:00 UTC is still Saturday 2026-11-21 in Costa Rica (UTC-6), so the week is 15..21.
        await CreateSut(repo, "2026-11-22T02:00:00+00:00").GetWeeklyReportAsync();

        repo.Verify(r => r.GetPeriodReportAsync("weekly", new DateOnly(2026, 11, 15), new DateOnly(2026, 11, 21), new DateOnly(2026, 11, 21), null, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetMonthlyReportAsync_WithAnyDayOfTheMonth_AsksForTheWholeMonth()
    {
        var repo = new Mock<IReportRepository>();
        var report = EmptyPeriodReport("monthly", new DateOnly(2028, 2, 1), new DateOnly(2028, 2, 29));
        repo.Setup(r => r.GetPeriodReportAsync("monthly", new DateOnly(2028, 2, 1), new DateOnly(2028, 2, 29), new DateOnly(2026, 11, 20), "barber1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(report);

        var result = await CreateSut(repo, "2026-11-20T15:00:00+00:00").GetMonthlyReportAsync(new DateOnly(2028, 2, 10), "barber1");

        Assert.Same(report, result);
    }

    [Fact]
    public async Task GetMonthlyReportAsync_WithoutAnchor_UsesTheCurrentMonth()
    {
        var repo = new Mock<IReportRepository>();
        repo.Setup(r => r.GetPeriodReportAsync(It.IsAny<string>(), It.IsAny<DateOnly>(), It.IsAny<DateOnly>(), It.IsAny<DateOnly>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(EmptyPeriodReport("monthly", default, default));

        await CreateSut(repo, "2026-11-20T15:00:00+00:00").GetMonthlyReportAsync();

        repo.Verify(r => r.GetPeriodReportAsync("monthly", new DateOnly(2026, 11, 1), new DateOnly(2026, 11, 30), new DateOnly(2026, 11, 20), null, It.IsAny<CancellationToken>()), Times.Once);
    }
}
