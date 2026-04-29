using Barber.Flow.Domain.Interfaces;
using System.Collections.Concurrent;

namespace Barber.Flow.Infrastructure.Services.InMemory;

public class InMemoryAppointmentRepository : IAppointmentRepository
{
    private readonly ConcurrentDictionary<string, Domain.Entities.Appointments> _store = new();
    private int _seq = 0;

    private string GenerateId()
    {
        var seq = Interlocked.Increment(ref _seq) - 1;
        return $"APT-{seq.ToString().PadLeft(4, '0')}";
    }

    public Task<string> GetNextIdAsync(CancellationToken cancellation = default)
    {
        var seq = Volatile.Read(ref _seq);
        return Task.FromResult($"APT-{seq.ToString().PadLeft(4, '0')}");
    }

    public Task<Domain.Entities.Appointments> CreateAsync(Domain.Entities.Appointments appointment, CancellationToken cancellation = default)
    {
        if (string.IsNullOrWhiteSpace(appointment.Id)) appointment.Id = GenerateId();
        appointment.CreatedAt = DateTime.UtcNow;
        appointment.UpdatedAt = appointment.CreatedAt;
        _store[appointment.Id] = appointment;
        return Task.FromResult(appointment);
    }

    public Task<Domain.Entities.Appointments?> UpdateAsync(string id, Domain.Entities.Appointments appointment, CancellationToken cancellation = default)
    {
        if (!_store.TryGetValue(id, out var existing))
            return Task.FromResult<Domain.Entities.Appointments?>(null);

        existing.ClientName = appointment.ClientName;
        existing.Phone = appointment.Phone;
        existing.Date = appointment.Date;
        existing.Time = appointment.Time;
        existing.Status = appointment.Status;
        existing.CompletedAt = appointment.CompletedAt;
        existing.PaymentMethodUsed = appointment.PaymentMethodUsed;
        existing.ServiceName = appointment.ServiceName;
        existing.ServicePrice = appointment.ServicePrice;
        existing.Notes = appointment.Notes;
        existing.UpdatedAt = DateTime.UtcNow;
        existing.UpdatedBy = appointment.UpdatedBy;
        _store[id] = existing;

        return Task.FromResult<Domain.Entities.Appointments?>(existing);
    }

    public Task<bool> DeleteAsync(string id, CancellationToken cancellation = default)
        => Task.FromResult(_store.TryRemove(id, out _));

    public Task<Domain.Entities.Appointments?> GetByIdAsync(string id, CancellationToken cancellation = default)
    {
        _store.TryGetValue(id, out var appointment);
        return Task.FromResult(appointment);
    }

    public Task<IEnumerable<Domain.Entities.Appointments>> FindAsync(
        string? date = null,
        string? status = null,
        string? query = null,
        int? page = null,
        int? pageSize = null,
        CancellationToken cancellation = default)
    {
        var list = _store.Values.AsEnumerable();

        if (!string.IsNullOrWhiteSpace(date))
            list = list.Where(a => a.Date == date.Trim());

        if (!string.IsNullOrWhiteSpace(status))
            list = list.Where(a => a.Status.Equals(status.Trim(), StringComparison.OrdinalIgnoreCase));

        if (!string.IsNullOrWhiteSpace(query))
        {
            var q = query.Trim().ToLowerInvariant();
            list = list.Where(a =>
                a.ClientName.ToLowerInvariant().Contains(q) ||
                a.Phone.ToLowerInvariant().Contains(q));
        }

        list = list.OrderBy(a => a.Date).ThenBy(a => a.Time);

        var ps = pageSize ?? 50;
        var pg = (page ?? 1) - 1;
        list = list.Skip(pg * ps).Take(ps);

        return Task.FromResult(list);
    }

    public Task<Domain.Entities.Appointments?> MoveAsync(string id, string newDate, CancellationToken cancellation = default)
    {
        if (!_store.TryGetValue(id, out var existing))
            return Task.FromResult<Domain.Entities.Appointments?>(null);

        existing.Date = newDate;
        existing.UpdatedAt = DateTime.UtcNow;
        _store[id] = existing;

        return Task.FromResult<Domain.Entities.Appointments?>(existing);
    }
}
