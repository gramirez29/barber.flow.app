namespace Barber.Flow.Api.DTOs.Requests;

/// <summary>
/// Changes how long an appointment lasts. <c>NewTime</c> is only sent when the start moves too
/// (dragging the top handle): the end stays where it was and the duration changes accordingly.
/// </summary>
public record ResizeAppointmentRequest(int DurationMinutes, string? NewTime = null);
