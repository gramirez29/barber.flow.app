namespace Barber.Flow.Application.Services.Appointments;

public interface IAppointmentService
{
    Task<Domain.Entities.Appointments> CreateAsync(Domain.Entities.Appointments appointment, CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a recurring series starting at <paramref name="template"/>.Date. The number of appointments
    /// is NOT chosen by the caller: it is the creating barber's MaxRecurringAppointments setting
    /// (0/unset = recurrence disabled). Free slots are created; colliding ones are reported back.
    /// </summary>
    Task<RecurringAppointmentsResult> CreateRecurringAsync(Domain.Entities.Appointments template, RecurrenceFrequency frequency, CancellationToken cancellationToken = default);

    Task<Domain.Entities.Appointments?> UpdateAsync(string id, Domain.Entities.Appointments appointment, CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(string id, CancellationToken cancellationToken = default);

    Task<Domain.Entities.Appointments?> GetByIdAsync(string id, CancellationToken cancellationToken = default);

    Task<IEnumerable<Domain.Entities.Appointments>> FindAsync(
        string? date = null,
        string? endDate = null,
        string? status = null,
        string? query = null,
        int? page = null,
        int? pageSize = null,
        string? shopId = null,
        string? createdBy = null,
        CancellationToken cancellationToken = default);

    Task<Domain.Entities.Appointments?> MoveAsync(string id, string newDate, string? newTime = null, CancellationToken cancellationToken = default);

    /// <summary>Changes the duration (and optionally the start time) of an appointment. Requires the owner to have adjustable durations enabled.</summary>
    Task<Domain.Entities.Appointments?> ResizeAsync(string id, int durationMinutes, string? newTime = null, CancellationToken cancellationToken = default);

    Task<string> GetNextIdAsync(CancellationToken cancellationToken = default);
}
