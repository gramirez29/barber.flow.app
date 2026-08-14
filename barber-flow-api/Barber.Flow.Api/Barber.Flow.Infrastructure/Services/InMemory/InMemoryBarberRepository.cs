using Barber.Flow.Domain.Interfaces;
using Barber.Flow.Domain.ValueObjects;
using System.Collections.Concurrent;
using System.Threading;

namespace Barber.Flow.Infrastructure.Services.InMemory;

public class InMemoryBarberRepository : IBarberRepository
{
    private readonly ConcurrentDictionary<string, Domain.Entities.Barber> _store = new();
    private int _seq = 0;

    public InMemoryBarberRepository()
    {
        // seed example barbers with default settings
        var b1 = new Domain.Entities.Barber 
        { 
            Id = GenerateId(), 
            UserName = "Admin User", 
            UserPhone = "8888-0000", 
            UserEmail = "admin@example.com", 
            BarberName = "Main Barber", 
            BarberPhone = "8888-0000", 
            Address = "Main Street 1",
            Settings = new BarberSettings(CommissionPercentage: 40m, FixedDailyExpense: 12000m)
        };
        _store[b1.Id] = b1;
    }

    private string GenerateId()
    {
        var seq = Interlocked.Increment(ref _seq) - 1; // return current then increment
        return $"CRB-{seq.ToString().PadLeft(4, '0')}";
    }

    public Task<string> GetNextIdAsync(CancellationToken cancellation = default)
    {
        // Non-destructive peek: return the next ID without advancing the sequence.
        // `_seq` is advanced when a new Barber is actually created (GenerateId()).
        var seq = Volatile.Read(ref _seq);
        var id = $"CRB-{seq.ToString().PadLeft(4, '0')}";
        return Task.FromResult(id);
    }

    public Task<Domain.Entities.Barber> CreateAsync(Domain.Entities.Barber barber, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(barber.Id)) barber.Id = GenerateId();
        barber.CreatedAt = DateTime.UtcNow;
        barber.UpdatedAt = barber.CreatedAt;
        _store[barber.Id] = barber;
        return Task.FromResult(barber);
    }

    public Task<Domain.Entities.Barber?> UpdateAsync(string id, Domain.Entities.Barber barber, CancellationToken ct = default)
    {
        if (!_store.ContainsKey(id)) return Task.FromResult<Domain.Entities.Barber?>(null);
        var existing = _store[id];
        existing.UserName = barber.UserName;
        existing.UserPhone = barber.UserPhone;
        existing.UserEmail = barber.UserEmail;
        existing.BarberName = barber.BarberName;
        existing.BarberPhone = barber.BarberPhone;
        existing.Address = barber.Address;
        existing.BarberShopName = barber.BarberShopName;
        existing.BarberShopPhone = barber.BarberShopPhone;
        existing.PhotoUrl = barber.PhotoUrl;
        existing.Settings = barber.Settings;
        existing.ShopId = barber.ShopId;
        existing.UpdatedAt = DateTime.UtcNow;
        _store[id] = existing;
        return Task.FromResult<Domain.Entities.Barber?>(existing);
    }

    public Task<bool> DeleteAsync(string id, CancellationToken ct = default)
    {
        return Task.FromResult(_store.TryRemove(id, out _));
    }

    public Task<Domain.Entities.Barber?> GetByIdAsync(string id, CancellationToken ct = default)
    {
        _store.TryGetValue(id, out var b);
        return Task.FromResult(b);
    }

    public Task<Domain.Entities.Barber?> GetByUserNameAsync(string userName, CancellationToken cancellation = default)
    {
        var barber = _store.Values.FirstOrDefault(b => string.Equals(b.UserName, userName, StringComparison.OrdinalIgnoreCase));
        return Task.FromResult(barber);
    }

    public Task<IEnumerable<Domain.Entities.Barber>> FindAsync(string? query = null, int? page = null, int? pageSize = null, CancellationToken ct = default)
    {
        var list = _store.Values.AsEnumerable();
        if (!string.IsNullOrWhiteSpace(query))
        {
            var q = query.Trim().ToLowerInvariant();
            list = list.Where(b => (b.Id ?? string.Empty).ToLowerInvariant().Contains(q)
                                    || (b.UserName ?? string.Empty).ToLowerInvariant().Contains(q)
                                    || (b.UserEmail ?? string.Empty).ToLowerInvariant().Contains(q)
                                    || (b.BarberName ?? string.Empty).ToLowerInvariant().Contains(q));
        }
        if (page.HasValue && pageSize.HasValue)
        {
            list = list.Skip((page.Value - 1) * pageSize.Value).Take(pageSize.Value);
        }
        return Task.FromResult(list);
    }
}
