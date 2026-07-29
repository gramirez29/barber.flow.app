using Barber.Flow.Domain.Interfaces;

namespace Barber.Flow.Application.Services.Appointments;

public class AppointmentService(IAppointmentRepository repo, IBarberRepository barberRepo) : IAppointmentService
{
    private readonly IAppointmentRepository _repo = repo;
    private readonly IBarberRepository _barberRepo = barberRepo;

    public async Task<Domain.Entities.Appointments> CreateAsync(Domain.Entities.Appointments appointment, CancellationToken cancellationToken = default)
    {
        // ShopId identifies the tenant an appointment belongs to; it's derived from the
        // creating barber's own shop unless the caller already supplied one explicitly.
        if (string.IsNullOrWhiteSpace(appointment.ShopId) && !string.IsNullOrWhiteSpace(appointment.CreatedBy))
        {
            var barber = await _barberRepo.GetByUserNameAsync(appointment.CreatedBy, cancellationToken);
            appointment.ShopId = barber?.ShopId;
        }

        return await _repo.CreateAsync(appointment, cancellationToken);
    }

    public async Task<Domain.Entities.Appointments?> UpdateAsync(string id, Domain.Entities.Appointments appointment, CancellationToken cancellationToken = default)
    {
        var existing = await _repo.GetByIdAsync(id, cancellationToken);
        if (existing == null)
        {
            return null;
        }

        // ShopId is set at creation time and must not be reassigned by whoever edits the appointment later.
        appointment.ShopId = existing.ShopId;

        return await _repo.UpdateAsync(id, appointment, cancellationToken);
    }

    public Task<bool> DeleteAsync(string id, CancellationToken cancellationToken = default)
        => _repo.DeleteAsync(id, cancellationToken);

    public Task<Domain.Entities.Appointments?> GetByIdAsync(string id, CancellationToken cancellationToken = default)
        => _repo.GetByIdAsync(id, cancellationToken);

    public Task<IEnumerable<Domain.Entities.Appointments>> FindAsync(
        string? date = null,
        string? endDate = null,
        string? status = null,
        string? query = null,
        int? page = null,
        int? pageSize = null,
        CancellationToken cancellationToken = default)
        => _repo.FindAsync(date, endDate, status, query, page, pageSize, cancellationToken);

    public Task<Domain.Entities.Appointments?> MoveAsync(string id, string newDate, CancellationToken cancellationToken = default)
        => _repo.MoveAsync(id, newDate, cancellationToken);

    public Task<string> GetNextIdAsync(CancellationToken cancellationToken = default)
        => _repo.GetNextIdAsync(cancellationToken);
}
