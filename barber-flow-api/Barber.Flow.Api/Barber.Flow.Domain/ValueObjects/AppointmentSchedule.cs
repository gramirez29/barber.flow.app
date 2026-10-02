namespace Barber.Flow.Domain.ValueObjects;

/// <summary>
/// Pure scheduling rules for appointment durations (see AGENDA_DURATION_PLAN.md).
/// Times are "HH:mm" strings and are handled as minutes since midnight; the end of an appointment
/// is exclusive, so an appointment 11:00 + 30 min and another at 11:30 do not overlap.
/// </summary>
public static class AppointmentSchedule
{
    /// <summary>Duration assumed when none is stored (every appointment created before durations existed).</summary>
    public const int DefaultDurationMinutes = 30;

    public const int DurationStepMinutes = 15;

    public const int MinDurationMinutes = 15;

    public const int MaxDurationMinutes = 120;

    private const int MinutesPerDay = 24 * 60;

    public static bool IsValidDuration(int minutes) =>
        minutes is >= MinDurationMinutes and <= MaxDurationMinutes && minutes % DurationStepMinutes == 0;

    /// <summary>"HH:mm" -> minutes since midnight. False when the text is not a valid time of day.</summary>
    public static bool TryParseMinutes(string? time, out int minutes)
    {
        minutes = 0;
        var parts = time?.Trim().Split(':');
        if (parts is not { Length: 2 }
            || !int.TryParse(parts[0], out var hours)
            || !int.TryParse(parts[1], out var mins)
            || hours is < 0 or > 23
            || mins is < 0 or > 59)
        {
            return false;
        }

        minutes = hours * 60 + mins;
        return true;
    }

    public static string FormatMinutes(int minutes) => $"{minutes / 60:00}:{minutes % 60:00}";

    /// <summary>True when an appointment of <paramref name="durationMinutes"/> starting at <paramref name="startMinutes"/> fits in the day.</summary>
    public static bool FitsInDay(int startMinutes, int durationMinutes) => startMinutes + durationMinutes <= MinutesPerDay;

    /// <summary>
    /// Whether an existing appointment (its stored time/duration, null duration = 30) overlaps the
    /// range [newStart, newStart + newDuration). An existing appointment with an unparseable time never overlaps.
    /// </summary>
    public static bool Overlaps(string existingTime, int? existingDuration, int newStart, int newDuration)
    {
        if (!TryParseMinutes(existingTime, out var existingStart)) return false;

        var existingEnd = existingStart + (existingDuration ?? DefaultDurationMinutes);
        return existingStart < newStart + newDuration && newStart < existingEnd;
    }
}
