using Barber.Flow.Domain.ValueObjects;
using Barber.Flow.Infrastructure.Services.MongoDb;
using AppointmentEntity = Barber.Flow.Domain.Entities.Appointments;
using BarberEntity = Barber.Flow.Domain.Entities.Barber;

namespace Barber.Flow.Infrastructure.Tests.MongoDb;

/// <summary>
/// The weekly/monthly report against a real (embedded) MongoDB, wired with the real appointment and
/// barber repositories: it proves the whole period is read (not just a first page of 50) and that the
/// period figures equal the daily report of each day.
/// </summary>
[Collection(MongoDbCollection.Name)]
public class MongoDbReportPeriodIntegrationTests
{
    private readonly MongoDbFixture _fixture;

    public MongoDbReportPeriodIntegrationTests(MongoDbFixture fixture) => _fixture = fixture;

    private static AppointmentEntity CompletedSale(string owner, string date, string time, decimal price, string method) => new()
    {
        ClientName = "Cliente",
        Phone = "8888-0000",
        Date = date,
        Time = time,
        Status = "completed",
        ServicePrice = price,
        PaymentMethodUsed = method,
        CreatedBy = owner,
        UpdatedBy = owner,
    };

    // 4 completed appointments a day for the first 30 days of November 2026 = 120 for the owner.
    private async Task<(MongoDbReportRepository Reports, MongoDbAppointmentRepository Appointments)> SeedAsync(string owner)
    {
        var database = _fixture.CreateDatabase();
        var appointments = new MongoDbAppointmentRepository(database);
        var barbers = new MongoDbBarberRepository(database);

        await barbers.CreateAsync(new BarberEntity
        {
            UserName = owner,
            BarberName = owner,
            CreatedBy = "admin",
            Settings = new BarberSettings(40m, 2000m),
        });

        var methods = new[] { "cash", "sinpeMovil", "transfer", "cash" };
        for (var day = 1; day <= 30; day++)
        {
            for (var slot = 0; slot < 4; slot++)
            {
                await appointments.CreateAsync(CompletedSale(owner, $"2026-11-{day:D2}", $"{9 + slot}:00", 10000m + slot * 500m, methods[slot]));
            }
        }

        // Another barber's sales and a non-completed appointment of this one must not count.
        await appointments.CreateAsync(CompletedSale("other-barber", "2026-11-10", "09:00", 99999m, "cash"));
        var scheduled = CompletedSale(owner, "2026-11-10", "15:00", 77777m, "cash");
        scheduled.Status = "scheduled";
        await appointments.CreateAsync(scheduled);

        return (new MongoDbReportRepository(appointments, barbers), appointments);
    }

    [Fact]
    public async Task Monthly_ReadsTheWholeMonthNotJustTheFirst50Appointments()
    {
        var (reports, _) = await SeedAsync("monthly-owner");

        var report = await reports.GetPeriodReportAsync("monthly", new DateOnly(2026, 11, 1), new DateOnly(2026, 11, 30), today: new DateOnly(2026, 12, 15), "monthly-owner");

        Assert.Equal(120, report.TotalCustomersServed);
        Assert.Equal(30, report.Days.Count);
        Assert.All(report.Days, day => Assert.Equal(4, day.TotalCustomersServed));
        // 30 days x (10000 + 10500 + 11000 + 11500) = 30 x 43000
        Assert.Equal(1_290_000m, report.GrossRevenue);
        Assert.Equal(report.GrossRevenue, report.PaymentMethodBreakdown.Sum(m => m.Total));
    }

    [Fact]
    public async Task Weekly_CoversOnlyItsSundayToSaturdayDays()
    {
        var (reports, _) = await SeedAsync("weekly-owner");
        var (from, to) = ReportPeriods.GetWeek(new DateOnly(2026, 11, 18));

        var report = await reports.GetPeriodReportAsync("weekly", from, to, new DateOnly(2026, 12, 15), "weekly-owner");

        Assert.Equal(new DateOnly(2026, 11, 15), report.From);
        Assert.Equal(7, report.Days.Count);
        Assert.Equal(28, report.TotalCustomersServed);
        Assert.Equal(7 * 2000m, report.FixedExpenseTotal);
    }

    [Fact]
    public async Task Monthly_FigureOfEachDayEqualsTheDailyReport()
    {
        var (reports, _) = await SeedAsync("parity-owner");

        var period = await reports.GetPeriodReportAsync("monthly", new DateOnly(2026, 11, 1), new DateOnly(2026, 11, 30), new DateOnly(2026, 12, 15), "parity-owner");

        foreach (var date in new[] { new DateOnly(2026, 11, 1), new DateOnly(2026, 11, 10), new DateOnly(2026, 11, 30) })
        {
            var daily = await reports.GetDailyReportAsync(date, "parity-owner");
            var day = period.Days.Single(d => d.Date == date);

            Assert.Equal(daily.TotalCustomersServed, day.TotalCustomersServed);
            Assert.Equal(daily.GrossRevenue, day.GrossRevenue);
            Assert.Equal(daily.CommissionAmount, day.CommissionAmount);
            Assert.Equal(daily.NetProfit, day.NetProfit);
        }
    }

    [Fact]
    public async Task Monthly_InProgress_ChargesTheFixedExpenseOnlyUpToToday()
    {
        var (reports, _) = await SeedAsync("progress-owner");

        var report = await reports.GetPeriodReportAsync("monthly", new DateOnly(2026, 11, 1), new DateOnly(2026, 11, 30), today: new DateOnly(2026, 11, 10), "progress-owner");

        Assert.Equal(10, report.CountedDays);
        Assert.Equal(20000m, report.FixedExpenseTotal);
        Assert.Equal(report.GrossRevenue - report.CommissionAmount - 20000m, report.NetProfit);
    }
}
