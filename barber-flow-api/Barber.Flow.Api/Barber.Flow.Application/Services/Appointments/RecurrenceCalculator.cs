using System.Globalization;

namespace Barber.Flow.Application.Services.Appointments;

public static class RecurrenceCalculator
{
    private const string DateFormat = "yyyy-MM-dd";

    public static bool TryParseFrequency(string? value, out RecurrenceFrequency frequency)
    {
        switch (value?.Trim().ToLowerInvariant())
        {
            case "weekly": frequency = RecurrenceFrequency.Weekly; return true;
            case "biweekly": frequency = RecurrenceFrequency.Biweekly; return true;
            case "monthly": frequency = RecurrenceFrequency.Monthly; return true;
            default: frequency = default; return false;
        }
    }

    /// <summary>
    /// Returns <paramref name="count"/> dates ("yyyy-MM-dd"), the first being <paramref name="startDate"/>.
    /// Every occurrence is computed from the ORIGINAL start date (never chained from the previous one),
    /// so a monthly series starting on Jan 31 gives Jan 31, Feb 28/29, Mar 31, Apr 30... instead of
    /// drifting to the 28th after February.
    /// </summary>
    public static IReadOnlyList<string> GetDates(string startDate, RecurrenceFrequency frequency, int count)
    {
        if (!DateTime.TryParseExact(startDate, DateFormat, CultureInfo.InvariantCulture, DateTimeStyles.None, out var start))
        {
            throw new AppointmentSchedulingException("La fecha de la cita no es válida.");
        }

        var dates = new List<string>(count);
        for (var i = 0; i < count; i++)
        {
            var date = frequency switch
            {
                RecurrenceFrequency.Weekly => start.AddDays(7 * i),
                RecurrenceFrequency.Biweekly => start.AddDays(14 * i),
                RecurrenceFrequency.Monthly => start.AddMonths(i),
                _ => throw new ArgumentOutOfRangeException(nameof(frequency)),
            };
            dates.Add(date.ToString(DateFormat, CultureInfo.InvariantCulture));
        }

        return dates;
    }
}
