using Barber.Flow.Domain.Interfaces;
using Barber.Flow.Domain.ValueObjects;

namespace Barber.Flow.Application.Services.Appointments;

public class AppointmentService(IAppointmentRepository repo, IBarberRepository barberRepo) : IAppointmentService
{
    private readonly IAppointmentRepository _repo = repo;
    private readonly IBarberRepository _barberRepo = barberRepo;

    public async Task<Domain.Entities.Appointments> CreateAsync(Domain.Entities.Appointments appointment, CancellationToken cancellationToken = default)
    {
        // Durations are opt-in per barber (admin setting). Off: the stored duration is dropped and the
        // old exact date+time rule applies; on: validate it (default 30) and use the overlap rule.
        int? duration = null;
        if (await AreDurationsEnabledAsync(appointment.CreatedBy, cancellationToken))
        {
            duration = appointment.DurationMinutes ?? AppointmentSchedule.DefaultDurationMinutes;
            EnsureDurationIsValid(duration.Value);
        }
        appointment.DurationMinutes = duration;

        await EnsureSlotIsFreeAsync(appointment.CreatedBy, appointment.Date, appointment.Time, duration, excludeId: null, cancellationToken);

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
                DurationMinutes = template.DurationMinutes,
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

        // The owner is whoever created the appointment (an admin editing it must not change the rule).
        var owner = existing.CreatedBy;
        var durationsEnabled = await AreDurationsEnabledAsync(owner, cancellationToken);

        // A request that omits the duration (older clients, or the feature off) keeps the stored one,
        // so editing other fields never resets it.
        if (durationsEnabled && appointment.DurationMinutes is { } requested)
        {
            EnsureDurationIsValid(requested);
        }
        else
        {
            appointment.DurationMinutes = existing.DurationMinutes;
        }

        var effectiveDuration = durationsEnabled
            ? appointment.DurationMinutes ?? AppointmentSchedule.DefaultDurationMinutes
            : (int?)null;
        var durationChanged = durationsEnabled
            && effectiveDuration != (existing.DurationMinutes ?? AppointmentSchedule.DefaultDurationMinutes);

        // Only re-validate schedule if the date/time/duration actually changed, so saving unrelated
        // fields (e.g. marking a past appointment as completed) is never blocked.
        if (existing.Date != appointment.Date || existing.Time != appointment.Time || durationChanged)
        {
            await EnsureSlotIsFreeAsync(owner, appointment.Date, appointment.Time, effectiveDuration, id, cancellationToken);
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
        int? duration = await AreDurationsEnabledAsync(existing.CreatedBy, cancellationToken)
            ? existing.DurationMinutes ?? AppointmentSchedule.DefaultDurationMinutes
            : null;
        await EnsureSlotIsFreeAsync(existing.CreatedBy, newDate, effectiveTime, duration, id, cancellationToken);

        return await _repo.MoveAsync(id, newDate, newTime, cancellationToken);
    }

    public async Task<Domain.Entities.Appointments?> ResizeAsync(string id, int durationMinutes, string? newTime = null, CancellationToken cancellationToken = default)
    {
        var existing = await _repo.GetByIdAsync(id, cancellationToken);
        if (existing == null)
        {
            return null;
        }

        if (!await AreDurationsEnabledAsync(existing.CreatedBy, cancellationToken))
        {
            throw new AppointmentSchedulingException(
                "La duración ajustable de citas no está habilitada para este usuario.",
                AppointmentSchedulingException.FeatureDisabledCode);
        }

        EnsureDurationIsValid(durationMinutes);

        var time = string.IsNullOrWhiteSpace(newTime) ? existing.Time : newTime;
        if (!AppointmentSchedule.TryParseMinutes(time, out var start) || !AppointmentSchedule.FitsInDay(start, durationMinutes))
        {
            throw new AppointmentSchedulingException(
                "La cita debe empezar y terminar dentro del mismo día.",
                AppointmentSchedulingException.InvalidDurationCode);
        }

        await EnsureSlotIsFreeAsync(existing.CreatedBy, existing.Date, time, durationMinutes, id, cancellationToken);

        return await _repo.ResizeAsync(id, durationMinutes, string.IsNullOrWhiteSpace(newTime) ? null : newTime, cancellationToken);
    }

    public Task<string> GetNextIdAsync(CancellationToken cancellationToken = default)
        => _repo.GetNextIdAsync(cancellationToken);

    // Past and far-future dates are intentionally allowed: barbers log walk-ins after the fact
    // and book recurring clients weeks ahead. The only scheduling rule is "no two active
    // appointments in the exact same date + time slot" (cancelled ones don't count), checked per barber.
    // With adjustable durations on for the owner, the rule becomes "no overlapping time ranges" instead.
    private async Task EnsureSlotIsFreeAsync(string? owner, string date, string time, int? durationMinutes, string? excludeId, CancellationToken cancellationToken)
    {
        if (durationMinutes is { } duration && AppointmentSchedule.TryParseMinutes(time, out var start))
        {
            if (await _repo.HasOverlapAsync(owner, date, start, duration, excludeId, cancellationToken))
            {
                throw new AppointmentSchedulingException(
                    $"Ya existe una cita el {date} entre {AppointmentSchedule.FormatMinutes(start)} y {AppointmentSchedule.FormatMinutes(start + duration)}.",
                    AppointmentSchedulingException.SlotTakenCode);
            }

            return;
        }

        if (await _repo.HasConflictAsync(owner, date, time, excludeId, cancellationToken))
        {
            throw new AppointmentSchedulingException(
                $"Ya existe una cita agendada el {date} a las {time}.",
                AppointmentSchedulingException.SlotTakenCode);
        }
    }

    private async Task<bool> AreDurationsEnabledAsync(string? owner, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(owner)) return false;

        var barber = await _barberRepo.GetByUserNameAsync(owner, cancellationToken);
        return barber?.Settings?.EnableAppointmentDurations == true;
    }

    private static void EnsureDurationIsValid(int durationMinutes)
    {
        if (!AppointmentSchedule.IsValidDuration(durationMinutes))
        {
            throw new AppointmentSchedulingException(
                $"La duración debe ser un múltiplo de {AppointmentSchedule.DurationStepMinutes} entre {AppointmentSchedule.MinDurationMinutes} y {AppointmentSchedule.MaxDurationMinutes} minutos.",
                AppointmentSchedulingException.InvalidDurationCode);
        }
    }
}
