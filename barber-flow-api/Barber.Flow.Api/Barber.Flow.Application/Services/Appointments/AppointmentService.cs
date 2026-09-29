using Barber.Flow.Domain.Interfaces;

namespace Barber.Flow.Application.Services.Appointments;

public class AppointmentService(IAppointmentRepository repo, IBarberRepository barberRepo) : IAppointmentService
{
    private readonly IAppointmentRepository _repo = repo;
    private readonly IBarberRepository _barberRepo = barberRepo;

    public async Task<Domain.Entities.Appointments> CreateAsync(Domain.Entities.Appointments appointment, CancellationToken cancellationToken = default)
    {
        await EnsureSlotIsFreeAsync(appointment.Date, appointment.Time, excludeId: null, cancellationToken);

        // ShopId identifies the tenant an appointment belongs to; it's derived from the
        // creating barber's own shop unless the caller already supplied one explicitly.
        if (string.IsNullOrWhiteSpace(appointment.ShopId) && !string.IsNullOrWhiteSpace(appointment.CreatedBy))
        {
            var barber = await _barberRepo.GetByUserNameAsync(appointment.CreatedBy, cancellationToken);
            appointment.ShopId = barber?.ShopId;
        }

        return await _repo.CreateAsync(appointment, cancellationToken);
    }

    /// <summary>Hard ceiling regardless of what is stored in the barber's settings.</summary>
    public const int MaxRecurringAppointmentsLimit = 20;

    public async Task<RecurringAppointmentsResult> CreateRecurringAsync(
        Domain.Entities.Appointments template,
        RecurrenceFrequency frequency,
        CancellationToken cancellationToken = default)
    {
        var barber = string.IsNullOrWhiteSpace(template.CreatedBy)
            ? null
            : await _barberRepo.GetByUserNameAsync(template.CreatedBy, cancellationToken);
        var count = Math.Min(barber?.Settings?.MaxRecurringAppointments ?? 0, MaxRecurringAppointmentsLimit);

        if (count <= 0)
        {
            throw new AppointmentSchedulingException(
                "Las citas recurrentes no están habilitadas para este usuario.",
                AppointmentSchedulingException.RecurrenceDisabledCode);
        }

        var seriesId = Guid.NewGuid().ToString("N");
        var created = new List<Domain.Entities.Appointments>();
        var conflicts = new List<RecurrenceConflict>();

        var dates = RecurrenceCalculator.GetDates(template.Date, frequency, count);
        for (var i = 0; i < dates.Count; i++)
        {
            var date = dates[i];

            // Only the first appointment keeps the status the caller chose (it may already have been
            // attended); every later occurrence is a future booking, so it is always "scheduled".
            var isFirst = i == 0;
            var occurrence = new Domain.Entities.Appointments
            {
                ClientName = template.ClientName,
                Phone = template.Phone,
                ClientId = template.ClientId,
                Date = date,
                Time = template.Time,
                Status = isFirst ? template.Status : "scheduled",
                CompletedAt = isFirst ? template.CompletedAt : null,
                PaymentMethodUsed = template.PaymentMethodUsed,
                ServiceName = template.ServiceName,
                ServicePrice = template.ServicePrice,
                Notes = template.Notes,
                ShopId = template.ShopId,
                SeriesId = seriesId,
                CreatedBy = template.CreatedBy,
                UpdatedBy = template.UpdatedBy,
            };

            try
            {
                created.Add(await CreateAsync(occurrence, cancellationToken));
            }
            catch (AppointmentSchedulingException ex) when (ex.Code == AppointmentSchedulingException.SlotTakenCode)
            {
                conflicts.Add(new RecurrenceConflict(date, template.Time));
            }
        }

        if (created.Count == 0)
        {
            throw new AppointmentSchedulingException(
                "Todos los horarios de la serie ya están ocupados.",
                AppointmentSchedulingException.SlotTakenCode);
        }

        return new RecurringAppointmentsResult(seriesId, count, created, conflicts);
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
            await EnsureSlotIsFreeAsync(appointment.Date, appointment.Time, id, cancellationToken);
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
        string? shopId = null,
        string? createdBy = null,
        CancellationToken cancellationToken = default)
        => _repo.FindAsync(date, endDate, status, query, page, pageSize, shopId, createdBy, cancellationToken);

    public async Task<Domain.Entities.Appointments?> MoveAsync(string id, string newDate, string? newTime = null, CancellationToken cancellationToken = default)
    {
        var existing = await _repo.GetByIdAsync(id, cancellationToken);
        if (existing == null)
        {
            return null;
        }

        var effectiveTime = string.IsNullOrWhiteSpace(newTime) ? existing.Time : newTime;
        await EnsureSlotIsFreeAsync(newDate, effectiveTime, id, cancellationToken);

        return await _repo.MoveAsync(id, newDate, newTime, cancellationToken);
    }

    public Task<string> GetNextIdAsync(CancellationToken cancellationToken = default)
        => _repo.GetNextIdAsync(cancellationToken);

    // Past and far-future dates are intentionally allowed: barbers log walk-ins after the fact
    // and book recurring clients weeks ahead. The only scheduling rule is "no two active
    // appointments in the exact same date + time slot" (cancelled ones don't count).
    private async Task EnsureSlotIsFreeAsync(string date, string time, string? excludeId, CancellationToken cancellationToken)
    {
        if (await _repo.HasConflictAsync(date, time, excludeId, cancellationToken))
        {
            throw new AppointmentSchedulingException(
                $"Ya existe una cita agendada el {date} a las {time}.",
                AppointmentSchedulingException.SlotTakenCode);
        }
    }
}
