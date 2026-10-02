namespace Barber.Flow.Application.Services.Appointments;

public class AppointmentSchedulingException(string message, string? code = null) : Exception(message)
{
    /// <summary>Machine-readable reason clients can react to (e.g. <see cref="SlotTakenCode"/>).</summary>
    public string? Code { get; } = code;

    public const string SlotTakenCode = "SLOT_TAKEN";

    public const string RecurrenceDisabledCode = "RECURRENCE_DISABLED";

    /// <summary>The barber does not have adjustable appointment durations enabled (admin setting).</summary>
    public const string FeatureDisabledCode = "FEATURE_DISABLED";

    public const string InvalidDurationCode = "INVALID_DURATION";
}
