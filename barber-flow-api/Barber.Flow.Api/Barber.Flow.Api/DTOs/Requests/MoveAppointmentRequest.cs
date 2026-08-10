namespace Barber.Flow.Api.DTOs.Requests;

public record MoveAppointmentRequest(string NewDate, string? NewTime = null);
