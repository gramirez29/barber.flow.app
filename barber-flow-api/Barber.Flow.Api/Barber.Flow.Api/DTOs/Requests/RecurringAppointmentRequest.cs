namespace Barber.Flow.Api.DTOs.Requests;

/// <param name="Frequency">weekly | biweekly | monthly</param>
/// <param name="Appointment">First appointment of the series. How many are created is decided by the server
/// from the authenticated barber's MaxRecurringAppointments setting, never by the client.</param>
public record RecurringAppointmentRequest(string Frequency, AppointmentRequest Appointment);
