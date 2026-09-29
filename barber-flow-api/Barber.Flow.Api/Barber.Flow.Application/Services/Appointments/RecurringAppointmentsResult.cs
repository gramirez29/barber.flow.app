namespace Barber.Flow.Application.Services.Appointments;

public record RecurrenceConflict(string Date, string Time);

public record RecurringAppointmentsResult(
    string SeriesId,
    int RequestedCount,
    IReadOnlyList<Domain.Entities.Appointments> Created,
    IReadOnlyList<RecurrenceConflict> Conflicts);
