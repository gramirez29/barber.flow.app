using Barber.Flow.Domain.Interfaces;

namespace Barber.Flow.Application.Services.Appointments;

public class AppointmentService(IAppointmentRepository repo) : IAppointmentService
{
    private readonly IAppointmentRepository _repo = repo;

    public Task<Domain.Entities.Appointments> CreateAsync(Domain.Entities.Appointments appointment, CancellationToken cancellationToken = default)
        => _repo.CreateAsync(appointment, cancellationToken);

    public Task<Domain.Entities.Appointments?> UpdateAsync(string id, Domain.Entities.Appointments appointment, CancellationToken cancellationToken = default)
        => _repo.UpdateAsync(id, appointment, cancellationToken);

    public Task<bool> DeleteAsync(string id, CancellationToken cancellationToken = default)
        => _repo.DeleteAsync(id, cancellationToken);

    public Task<Domain.Entities.Appointments?> GetByIdAsync(string id, CancellationToken cancellationToken = default)
        => _repo.GetByIdAsync(id, cancellationToken);

    public Task<IEnumerable<Domain.Entities.Appointments>> FindAsync(
        string? date = null,
        string? status = null,
        string? query = null,
        int? page = null,
        int? pageSize = null,
        CancellationToken cancellationToken = default)
        => _repo.FindAsync(date, status, query, page, pageSize, cancellationToken);

    public Task<Domain.Entities.Appointments?> MoveAsync(string id, string newDate, CancellationToken cancellationToken = default)
        => _repo.MoveAsync(id, newDate, cancellationToken);

    public Task<string> GetNextIdAsync(CancellationToken cancellationToken = default)
        => _repo.GetNextIdAsync(cancellationToken);
}
