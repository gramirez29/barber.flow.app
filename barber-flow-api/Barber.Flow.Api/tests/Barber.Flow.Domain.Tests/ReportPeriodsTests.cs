using Barber.Flow.Domain.ValueObjects;

namespace Barber.Flow.Domain.Tests;

public class ReportPeriodsTests
{
    [Theory]
    // Anchors on every day of the Sunday 2026-11-15 .. Saturday 2026-11-21 week.
    [InlineData("2026-11-15", "2026-11-15", "2026-11-21")] // Sunday
    [InlineData("2026-11-16", "2026-11-15", "2026-11-21")] // Monday
    [InlineData("2026-11-18", "2026-11-15", "2026-11-21")] // Wednesday
    [InlineData("2026-11-21", "2026-11-15", "2026-11-21")] // Saturday
    // The next day starts a new week.
    [InlineData("2026-11-22", "2026-11-22", "2026-11-28")]
    // A week that crosses the end of a month.
    [InlineData("2026-12-02", "2026-11-29", "2026-12-05")]
    // A week that crosses the end of a year.
    [InlineData("2027-01-01", "2026-12-27", "2027-01-02")]
    public void GetWeek_RunsFromSundayToSaturday(string anchor, string expectedFrom, string expectedTo)
    {
        var (from, to) = ReportPeriods.GetWeek(DateOnly.Parse(anchor));

        Assert.Equal(DateOnly.Parse(expectedFrom), from);
        Assert.Equal(DateOnly.Parse(expectedTo), to);
        Assert.Equal(DayOfWeek.Sunday, from.DayOfWeek);
        Assert.Equal(DayOfWeek.Saturday, to.DayOfWeek);
    }

    [Theory]
    [InlineData("2026-11-20", "2026-11-01", "2026-11-30")] // 30 days
    [InlineData("2026-12-31", "2026-12-01", "2026-12-31")] // 31 days, last day of the year
    [InlineData("2026-02-10", "2026-02-01", "2026-02-28")] // February, non-leap
    [InlineData("2028-02-10", "2028-02-01", "2028-02-29")] // February, leap year
    [InlineData("2026-01-01", "2026-01-01", "2026-01-31")] // anchor on the first day
    [InlineData("2026-07-31", "2026-07-01", "2026-07-31")] // anchor on the last day
    public void GetMonth_CoversTheWholeCalendarMonth(string anchor, string expectedFrom, string expectedTo)
    {
        var (from, to) = ReportPeriods.GetMonth(DateOnly.Parse(anchor));

        Assert.Equal(DateOnly.Parse(expectedFrom), from);
        Assert.Equal(DateOnly.Parse(expectedTo), to);
    }

    [Theory]
    // 5:59 p.m. in Costa Rica is 23:59 UTC the same day.
    [InlineData("2026-11-20T23:59:00+00:00", "2026-11-20")]
    // 6:00 p.m. in Costa Rica is already midnight UTC of the next day: the business day hasn't changed.
    [InlineData("2026-11-21T00:00:00+00:00", "2026-11-20")]
    [InlineData("2026-11-21T05:59:00+00:00", "2026-11-20")]
    // Midnight in Costa Rica (06:00 UTC) starts the next business day.
    [InlineData("2026-11-21T06:00:00+00:00", "2026-11-21")]
    public void TodayInCostaRica_UsesTheUtcMinusSixOffset(string utcNow, string expectedToday)
    {
        var today = ReportPeriods.TodayInCostaRica(DateTimeOffset.Parse(utcNow));

        Assert.Equal(DateOnly.Parse(expectedToday), today);
    }
}
