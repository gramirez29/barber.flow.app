namespace Barber.Flow.Api.DTOs.Responses;

public record RecurrenceConflictDto(string Date, string Time);

public record RecurringAppointmentResponse(
    string SeriesId,
    int RequestedCount,
    IEnumerable<AppointmentResponse> Created,
    IEnumerable<RecurrenceConflictDto> Conflicts);
