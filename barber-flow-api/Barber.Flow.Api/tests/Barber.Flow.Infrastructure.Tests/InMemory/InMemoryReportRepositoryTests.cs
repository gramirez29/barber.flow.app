using Barber.Flow.Infrastructure.Services.InMemory;

namespace Barber.Flow.Infrastructure.Tests.InMemory;

public class InMemoryReportRepositoryTests
{
    // This repository always fabricates the same 4 demo appointments regardless of input -
    // it is not wired to real appointment data (see UNIT_TESTING_IMPLEMENTATION_PLAN.md §8).
    // These tests document/pin that current, deterministic-per-date behavior.

    [Fact]
    public async Task GetDailyReportAsync_AlwaysReturnsFourFabricatedAppointments()
    {
        var repo = new InMemoryReportRepository();

        var report = await repo.GetDailyReportAsync(new DateOnly(2026, 1, 15));

        Assert.Equal(4, report.TotalCustomersServed);
        Assert.Equal(4, report.CompletedAppointments.Count);
    }

    [Fact]
    public async Task GetDailyReportAsync_NetProfitEqualsGrossMinusCommissionMinusFixedExpense()
    {
        var repo = new InMemoryReportRepository();

        var report = await repo.GetDailyReportAsync(new DateOnly(2026, 1, 15));

        Assert.Equal(report.GrossRevenue - report.CommissionAmount - report.FixedDailyExpense, report.NetProfit);
    }

    [Fact]
    public async Task GetDailyReportAsync_SameDate_IsDeterministic()
    {
        var repo = new InMemoryReportRepository();
        var date = new DateOnly(2026, 3, 10);

        var first = await repo.GetDailyReportAsync(date);
        var second = await repo.GetDailyReportAsync(date);

        Assert.Equal(first.GrossRevenue, second.GrossRevenue);
        Assert.Equal(first.CompletedAppointments.Select(a => a.ServicePrice), second.CompletedAppointments.Select(a => a.ServicePrice));
    }

    [Fact]
    public async Task GetDailyReportAsync_ReportDateEchoesInputDate()
    {
        var repo = new InMemoryReportRepository();
        var date = new DateOnly(2026, 6, 1);

        var report = await repo.GetDailyReportAsync(date);

        Assert.Equal(date, report.ReportDate);
    }
}
