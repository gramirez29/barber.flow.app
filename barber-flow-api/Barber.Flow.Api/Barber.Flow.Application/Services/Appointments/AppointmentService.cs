using System.Globalization;
using Barber.Flow.Domain.Interfaces;

namespace Barber.Flow.Application.Services.Appointments;

public class AppointmentService(IAppointmentRepository repo, IBarberRepository barberRepo) : IAppointmentService
{
    private readonly IAppointmentRepository _repo = repo;
    private readonly IBarberRepository _barberRepo = barberRepo;

    public async Task<Domain.Entities.Appointments> CreateAsync(Domain.Entities.Appointments appointment, CancellationToken cancellationToken = default)
    {
        await EnsureScheduleIsValidAsync(appointment.Date, appointment.Time, excludeId: null, cancellationToken);

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

        // Only re-validate schedule if the date/time actually changed, so saving unrelated
        // fields (e.g. marking a past appointment as completed) is never blocked.
        if (existing.Date != appointment.Date || existing.Time != appointment.Time)
        {
            await EnsureScheduleIsValidAsync(appointment.Date, appointment.Time, id, cancellationToken);
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

    public async Task<Domain.Entities.Appointments?> MoveAsync(string id, string newDate, string? newTime = null, CancellationToken cancellationToken = default)
    {
        var existing = await _repo.GetByIdAsync(id, cancellationToken);
        if (existing == null)
        {
            return null;
        }

        var effectiveTime = string.IsNullOrWhiteSpace(newTime) ? existing.Time : newTime;
        await EnsureScheduleIsValidAsync(newDate, effectiveTime, id, cancellationToken);

        return await _repo.MoveAsync(id, newDate, newTime, cancellationToken);
    }

    public Task<string> GetNextIdAsync(CancellationToken cancellationToken = default)
        => _repo.GetNextIdAsync(cancellationToken);

    private async Task EnsureScheduleIsValidAsync(string date, string time, string? excludeId, CancellationToken cancellationToken)
    {
        if (DateTime.TryParseExact(
                $"{date} {time}",
                "yyyy-MM-dd HH:mm",
                CultureInfo.InvariantCulture,
                DateTimeStyles.None,
                out var scheduledAt))
        {
            if (scheduledAt <= DateTime.Now)
            {
                throw new AppointmentSchedulingException("La fecha y hora deben ser en el futuro.");
            }
        }

        if (await _repo.HasConflictAsync(date, time, excludeId, cancellationToken))
        {
            throw new AppointmentSchedulingException("Ya existe una cita agendada en esa fecha y hora.");
        }
    }
}
