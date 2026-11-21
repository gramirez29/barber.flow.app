using Barber.Flow.Domain.Entities;
using Barber.Flow.Domain.Interfaces;
using Barber.Flow.Domain.ValueObjects;
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

    // ---- weekly / monthly reports -------------------------------------------------------------

    // Week used below: Sunday 2026-11-15 .. Saturday 2026-11-21.
    private static readonly DateOnly WeekFrom = new(2026, 11, 15);
    private static readonly DateOnly WeekTo = new(2026, 11, 21);

    private static Appointments Sale(string date, decimal price, string? paymentMethod = "cash") => new()
    {
        Id = Guid.NewGuid().ToString(),
        ClientName = "Cliente",
        Date = date,
        Time = "10:00",
        Status = "completed",
        ServicePrice = price,
        PaymentMethodUsed = paymentMethod,
    };

    private void ReturnsSales(string? owner, params Appointments[] sales) =>
        _appointmentRepository
            .Setup(r => r.FindAsync("2026-11-15", "2026-11-21", "completed", null, null, null, null, owner, It.IsAny<CancellationToken>()))
            .ReturnsAsync(sales);

    private void BarberWith(string userName, decimal commission, decimal fixedExpense) =>
        _barberRepository
            .Setup(r => r.GetByUserNameAsync(userName, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new BarberEntity { UserName = userName, Settings = new BarberSettings(commission, fixedExpense, null, null) });

    [Fact]
    public async Task GetPeriodReportAsync_TotalsEqualTheSumOfEachDay()
    {
        BarberWith("barber1", 40m, 5000m);
        ReturnsSales("barber1", Sale("2026-11-16", 12500m), Sale("2026-11-16", 7500m), Sale("2026-11-18", 18000m), Sale("2026-11-20", 15000m));

        var report = await CreateSut().GetPeriodReportAsync("weekly", WeekFrom, WeekTo, today: new DateOnly(2026, 11, 25), "barber1");

        Assert.Equal(7, report.Days.Count);
        Assert.Equal(4, report.TotalCustomersServed);
        Assert.Equal(53000m, report.GrossRevenue);
        Assert.Equal(report.Days.Sum(d => d.GrossRevenue), report.GrossRevenue);
        Assert.Equal(report.Days.Sum(d => d.CommissionAmount), report.CommissionAmount);
        Assert.Equal(report.Days.Sum(d => d.NetProfit), report.NetProfit);
        Assert.Equal(report.Days.Sum(d => d.TotalCustomersServed), report.TotalCustomersServed);
    }

    [Fact]
    public async Task GetPeriodReportAsync_DaysAreInOrderAndIncludeDaysWithoutSales()
    {
        BarberWith("barber1", 40m, 0m);
        ReturnsSales("barber1", Sale("2026-11-18", 10000m));

        var report = await CreateSut().GetPeriodReportAsync("weekly", WeekFrom, WeekTo, new DateOnly(2026, 11, 25), "barber1");

        Assert.Equal(Enumerable.Range(15, 7).Select(d => new DateOnly(2026, 11, d)), report.Days.Select(d => d.Date));
        var wednesday = report.Days.Single(d => d.Date == new DateOnly(2026, 11, 18));
        Assert.Equal(1, wednesday.TotalCustomersServed);
        Assert.Equal(10000m, wednesday.GrossRevenue);
        var emptyDay = report.Days.Single(d => d.Date == new DateOnly(2026, 11, 17));
        Assert.Equal(0, emptyDay.TotalCustomersServed);
        Assert.Equal(0m, emptyDay.GrossRevenue);
    }

    [Fact]
    public async Task GetPeriodReportAsync_FinishedPeriod_ChargesTheFixedExpenseForEveryDay()
    {
        BarberWith("barber1", 40m, 5000m);
        ReturnsSales("barber1", Sale("2026-11-16", 10000m));

        var report = await CreateSut().GetPeriodReportAsync("weekly", WeekFrom, WeekTo, today: new DateOnly(2026, 11, 30), "barber1");

        Assert.Equal(7, report.CountedDays);
        Assert.Equal(5000m, report.FixedDailyExpense);
        Assert.Equal(35000m, report.FixedExpenseTotal);
        // gross 10000 - commission 4000 - expense 35000
        Assert.Equal(-29000m, report.NetProfit);
    }

    [Fact]
    public async Task GetPeriodReportAsync_PeriodInProgress_ChargesTheFixedExpenseOnlyUpToToday()
    {
        BarberWith("barber1", 40m, 5000m);
        ReturnsSales("barber1");

        // Today is Tuesday 2026-11-17: Sunday, Monday and Tuesday have happened.
        var report = await CreateSut().GetPeriodReportAsync("weekly", WeekFrom, WeekTo, today: new DateOnly(2026, 11, 17), "barber1");

        Assert.Equal(3, report.CountedDays);
        Assert.Equal(15000m, report.FixedExpenseTotal);
        Assert.Equal(new[] { 5000m, 5000m, 5000m, 0m, 0m, 0m, 0m }, report.Days.Select(d => d.FixedExpense));
    }

    [Fact]
    public async Task GetPeriodReportAsync_FuturePeriod_ChargesNothing()
    {
        BarberWith("barber1", 40m, 5000m);
        ReturnsSales("barber1");

        var report = await CreateSut().GetPeriodReportAsync("weekly", WeekFrom, WeekTo, today: new DateOnly(2026, 11, 1), "barber1");

        Assert.Equal(0, report.CountedDays);
        Assert.Equal(0m, report.FixedExpenseTotal);
        Assert.Equal(0m, report.NetProfit);
    }

    [Fact]
    public async Task GetPeriodReportAsync_FixedExpenseOfZero_DoesNotChangeTheNetProfit()
    {
        BarberWith("barber1", 40m, 0m);
        ReturnsSales("barber1", Sale("2026-11-16", 10000m));

        var report = await CreateSut().GetPeriodReportAsync("weekly", WeekFrom, WeekTo, new DateOnly(2026, 11, 30), "barber1");

        Assert.Equal(0m, report.FixedExpenseTotal);
        Assert.Equal(6000m, report.NetProfit);
    }

    [Fact]
    public async Task GetPeriodReportAsync_CommissionIsRoundedPerDayLikeTheDailyReport()
    {
        // 33.33% of 100.05 = 33.3467 -> 33.35 each day; rounding the combined 200.10 once would give 66.69.
        BarberWith("barber1", 33.33m, 0m);
        ReturnsSales("barber1", Sale("2026-11-16", 100.05m), Sale("2026-11-17", 100.05m));

        var report = await CreateSut().GetPeriodReportAsync("weekly", WeekFrom, WeekTo, new DateOnly(2026, 11, 30), "barber1");

        Assert.Equal(33.35m, report.Days.Single(d => d.Date == new DateOnly(2026, 11, 16)).CommissionAmount);
        Assert.Equal(66.70m, report.CommissionAmount);
    }

    [Fact]
    public async Task GetPeriodReportAsync_PeriodTotalsMatchTheDailyReportOfEachDay()
    {
        BarberWith("barber1", 40m, 3000m);
        var monday = Sale("2026-11-16", 12345.67m);
        var wednesday = Sale("2026-11-18", 9999.99m);
        ReturnsSales("barber1", monday, wednesday);
        _appointmentRepository
            .Setup(r => r.FindAsync("2026-11-16", "2026-11-16", "completed", null, null, null, null, "barber1", It.IsAny<CancellationToken>()))
            .ReturnsAsync([monday]);
        var sut = CreateSut();

        var period = await sut.GetPeriodReportAsync("weekly", WeekFrom, WeekTo, new DateOnly(2026, 11, 30), "barber1");
        var daily = await sut.GetDailyReportAsync(new DateOnly(2026, 11, 16), "barber1");

        var day = period.Days.Single(d => d.Date == new DateOnly(2026, 11, 16));
        Assert.Equal(daily.GrossRevenue, day.GrossRevenue);
        Assert.Equal(daily.CommissionAmount, day.CommissionAmount);
        Assert.Equal(daily.NetProfit, day.NetProfit);
        Assert.Equal(daily.TotalCustomersServed, day.TotalCustomersServed);
    }

    [Fact]
    public async Task GetPeriodReportAsync_PaymentBreakdownReconcilesWithTheGrossAndNormalizesOldMethods()
    {
        BarberWith("barber1", 40m, 0m);
        ReturnsSales("barber1",
            Sale("2026-11-16", 10000m, "cash"),
            Sale("2026-11-17", 20000m, "sinpe_movil"),
            Sale("2026-11-18", 5000m, "transfer"),
            Sale("2026-11-19", 3000m, null));

        var report = await CreateSut().GetPeriodReportAsync("weekly", WeekFrom, WeekTo, new DateOnly(2026, 11, 30), "barber1");

        Assert.Equal(4, report.PaymentMethodBreakdown.Count);
        Assert.Equal(report.GrossRevenue, report.PaymentMethodBreakdown.Sum(m => m.Total));
        Assert.Equal(20000m, report.PaymentMethodBreakdown.Single(m => m.PaymentMethod == "sinpeMovil").Total);
        Assert.Equal(3000m, report.PaymentMethodBreakdown.Single(m => m.PaymentMethod == "none").Total);
    }

    [Fact]
    public async Task GetPeriodReportAsync_LinkedBarber_OnlyAsksForTheirOwnAppointments()
    {
        BarberWith("barber1", 40m, 0m);
        ReturnsSales("barber1");

        await CreateSut().GetPeriodReportAsync("weekly", WeekFrom, WeekTo, new DateOnly(2026, 11, 30), "barber1");

        _appointmentRepository.Verify(
            r => r.FindAsync("2026-11-15", "2026-11-21", "completed", null, null, null, null, "barber1", It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task GetPeriodReportAsync_AccountWithoutBarber_IsUnfilteredAndUsesTheDefaults()
    {
        _barberRepository.Setup(r => r.GetByUserNameAsync("admin", It.IsAny<CancellationToken>())).ReturnsAsync((BarberEntity?)null);
        ReturnsSales(null, Sale("2026-11-16", 10000m));

        var report = await CreateSut().GetPeriodReportAsync("weekly", WeekFrom, WeekTo, new DateOnly(2026, 11, 30), "admin");

        // Defaults: 40% commission and no fixed expense.
        Assert.Equal(4000m, report.CommissionAmount);
        Assert.Equal(0m, report.FixedDailyExpense);
        Assert.Equal(6000m, report.NetProfit);
    }

    [Fact]
    public async Task GetPeriodReportAsync_MonthlyPeriod_HasOneEntryPerDayOfTheMonth()
    {
        BarberWith("barber1", 40m, 0m);
        _appointmentRepository
            .Setup(r => r.FindAsync("2026-02-01", "2026-02-28", "completed", null, null, null, null, "barber1", It.IsAny<CancellationToken>()))
            .ReturnsAsync([Sale("2026-02-28", 8000m)]);

        var report = await CreateSut().GetPeriodReportAsync("monthly", new DateOnly(2026, 2, 1), new DateOnly(2026, 2, 28), new DateOnly(2026, 3, 5), "barber1");

        Assert.Equal("monthly", report.PeriodType);
        Assert.Equal(28, report.Days.Count);
        Assert.Equal(8000m, report.Days.Last().GrossRevenue);
    }

    [Fact]
    public async Task GetPeriodReportAsync_EmptyPeriod_ReturnsAllDaysAtZero()
    {
        BarberWith("barber1", 40m, 0m);
        ReturnsSales("barber1");

        var report = await CreateSut().GetPeriodReportAsync("weekly", WeekFrom, WeekTo, new DateOnly(2026, 11, 30), "barber1");

        Assert.Equal(0, report.TotalCustomersServed);
        Assert.Equal(0m, report.GrossRevenue);
        Assert.Equal(0m, report.NetProfit);
        Assert.All(report.Days, day => Assert.Equal(0m, day.GrossRevenue));
        Assert.All(report.PaymentMethodBreakdown, method => Assert.Equal(0m, method.Total));
    }

    [Fact]
    public async Task GetPeriodReportAsync_IgnoresAppointmentsWithAnUnreadableDate()
    {
        BarberWith("barber1", 40m, 0m);
        ReturnsSales("barber1", Sale("not-a-date", 9999m), Sale("2026-11-16", 1000m));

        var report = await CreateSut().GetPeriodReportAsync("weekly", WeekFrom, WeekTo, new DateOnly(2026, 11, 30), "barber1");

        Assert.Equal(1000m, report.GrossRevenue);
        Assert.Equal(1, report.TotalCustomersServed);
    }
}
