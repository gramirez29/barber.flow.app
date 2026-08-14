using Barber.Flow.Domain.Entities;
using Barber.Flow.Domain.Interfaces;
using System.Collections.Concurrent;

namespace Barber.Flow.Infrastructure.Services.InMemory;

public class InMemoryBarberShopRepository : IBarberShopRepository
{
    private readonly ConcurrentDictionary<string, BarberShop> _store = new();
    private int _counter = 1;
    private readonly object _lock = new();

    public InMemoryBarberShopRepository()
    {
        // Seed default barbershop
        var defaultShop = new BarberShop
        {
            Id = "SHOP-0001",
            Name = "Mi Barbería",
            Phone = "0000-0000",
            Address = "Dirección predeterminada",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = "system",
            UpdatedBy = "system"
        };
        _store[defaultShop.Id] = defaultShop;
        _counter = 2;
    }

    public Task<IEnumerable<BarberShop>> GetAllAsync(string userName, int page = 1, int pageSize = 10)
    {
        var shops = _store.Values
            .Where(s => s.CreatedBy == userName)
            .OrderByDescending(s => s.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize);

        return Task.FromResult<IEnumerable<BarberShop>>(shops.ToList());
    }

    public Task<BarberShop?> GetByIdAsync(string id, string userName)
    {
        if (_store.TryGetValue(id, out var shop) && shop.CreatedBy == userName)
        {
            return Task.FromResult<BarberShop?>(shop);
        }
        return Task.FromResult<BarberShop?>(null);
    }

    public Task<BarberShop> CreateAsync(BarberShop barberShop)
    {
        barberShop.Id = GetNextIdAsync().Result;
        barberShop.CreatedAt = DateTime.UtcNow;
        barberShop.UpdatedAt = barberShop.CreatedAt;
        _store[barberShop.Id] = barberShop;
        return Task.FromResult(barberShop);
    }

    public Task<BarberShop> UpdateAsync(BarberShop barberShop)
    {
        if (_store.TryGetValue(barberShop.Id, out var existing) && existing.CreatedBy == barberShop.UpdatedBy)
        {
            existing.Name = barberShop.Name;
            existing.Phone = barberShop.Phone;
            existing.Address = barberShop.Address;
            existing.UpdatedAt = DateTime.UtcNow;
            existing.UpdatedBy = barberShop.UpdatedBy;
            _store[existing.Id] = existing;
            return Task.FromResult(existing);
        }
        throw new InvalidOperationException($"BarberShop with ID {barberShop.Id} not found or unauthorized.");
    }

    public Task<bool> DeleteAsync(string id, string userName)
    {
        if (_store.TryGetValue(id, out var shop) && shop.CreatedBy == userName)
        {
            return Task.FromResult(_store.TryRemove(id, out _));
        }
        return Task.FromResult(false);
    }

    public Task<string> GetNextIdAsync()
    {
        lock (_lock)
        {
            var id = $"SHOP-{_counter:D4}";
            _counter++;
            return Task.FromResult(id);
        }
    }
}
