namespace Barber.Flow.Application.Services.Appointments;

public class AppointmentSchedulingException(string message, string? code = null) : Exception(message)
{
    /// <summary>Machine-readable reason clients can react to (e.g. <see cref="SlotTakenCode"/>).</summary>
    public string? Code { get; } = code;

    public const string SlotTakenCode = "SLOT_TAKEN";
}
