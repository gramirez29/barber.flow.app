namespace Barber.Flow.Application.Services.Appointments;

public interface IAppointmentService
{
    Task<Domain.Entities.Appointments> CreateAsync(Domain.Entities.Appointments appointment, CancellationToken cancellationToken = default);

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

    Task<string> GetNextIdAsync(CancellationToken cancellationToken = default);
}
