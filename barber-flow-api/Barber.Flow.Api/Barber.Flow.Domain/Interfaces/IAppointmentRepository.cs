namespace Barber.Flow.Domain.Interfaces;

public interface IAppointmentRepository
{
    Task<Entities.Appointments> CreateAsync(Entities.Appointments appointment, CancellationToken cancellation = default);

    Task<Entities.Appointments?> UpdateAsync(string id, Entities.Appointments appointment, CancellationToken cancellation = default);

    Task<bool> DeleteAsync(string id, CancellationToken cancellation = default);

    Task<Entities.Appointments?> GetByIdAsync(string id, CancellationToken cancellation = default);

    Task<IEnumerable<Entities.Appointments>> FindAsync(
        string? date = null,
        string? endDate = null,
        string? status = null,
        string? query = null,
        int? page = null,
        int? pageSize = null,
        CancellationToken cancellation = default);

    Task<Entities.Appointments?> MoveAsync(string id, string newDate, CancellationToken cancellation = default);

    Task<string> GetNextIdAsync(CancellationToken cancellation = default);
}
