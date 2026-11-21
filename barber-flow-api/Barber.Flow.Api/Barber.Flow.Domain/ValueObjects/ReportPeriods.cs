namespace Barber.Flow.Domain.ValueObjects;

/// <summary>
/// Date math for the weekly and monthly reports. Pure and clock-free so the boundaries (week edges,
/// month lengths, leap years, year changes) are easy to test.
/// </summary>
public static class ReportPeriods
{
    /// <summary>Costa Rica has no daylight saving time, so its offset from UTC is always -6 hours.</summary>
    public const int CostaRicaUtcOffsetHours = -6;

    /// <summary>
    /// The week containing <paramref name="anchor"/>, from Sunday to Saturday (both inclusive).
    /// </summary>
    public static (DateOnly From, DateOnly To) GetWeek(DateOnly anchor)
    {
        var from = anchor.AddDays(-(int)anchor.DayOfWeek);
        return (from, from.AddDays(6));
    }

    /// <summary>
    /// The calendar month containing <paramref name="anchor"/>, from its first to its last day.
    /// </summary>
    public static (DateOnly From, DateOnly To) GetMonth(DateOnly anchor)
    {
        var from = new DateOnly(anchor.Year, anchor.Month, 1);
        return (from, from.AddMonths(1).AddDays(-1));
    }

    /// <summary>
    /// "Today" for the business: the date in Costa Rica, not the server's (the API runs in UTC, so
    /// from 6 p.m. local time the server is already on the next day).
    /// </summary>
    public static DateOnly TodayInCostaRica(DateTimeOffset utcNow) =>
        DateOnly.FromDateTime(utcNow.UtcDateTime.AddHours(CostaRicaUtcOffsetHours));
}
