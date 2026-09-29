namespace Barber.Flow.Application.Services.Appointments;

public enum RecurrenceFrequency
{
    /// <summary>Every 7 days (same weekday).</summary>
    Weekly,

    /// <summary>Every 14 days (same weekday).</summary>
    Biweekly,

    /// <summary>Same day of month, clamped to the last day of shorter months.</summary>
    Monthly,
}
