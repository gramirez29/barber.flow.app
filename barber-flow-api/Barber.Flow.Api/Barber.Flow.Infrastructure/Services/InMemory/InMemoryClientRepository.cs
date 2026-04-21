using Barber.Flow.Domain.Entities;
using Barber.Flow.Domain.Interfaces;
using System.Collections.Concurrent;

namespace Barber.Flow.Infrastructure.Services.InMemory;

public class InMemoryClientRepository : IClientRepository
{
    private readonly ConcurrentDictionary<string, Client> _store = new();

        public InMemoryClientRepository()
    {
        // Seed some mock clients
        var client1 = new Client { FirstName = "Juan", LastName = "Perez", Phone = "8888-0000", Email = "juan.perez@example.com", Address = "Av Central 123", PaymentMethod = "Cash", Active = true };
        var client2 = new Client { FirstName = "Maria", LastName = "Gomez", Phone = "7777-1111", Email = "maria.gomez@example.com", Address = "Calle 45", PaymentMethod = "Sinpe Movil", Active = true };
        var client3 = new Client { FirstName = "Carlos", LastName = "Lopez", Phone = "6666-2222", Email = "carlos.lopez@example.com", Address = "Calle 67", PaymentMethod = "Credit Card", Active = true };
        var client4 = new Client { FirstName = "Guillermo", LastName = "Ramirez", Phone = "7018-9220", Email = "guillermo.ramirez@example.com", Address = "Caballo Blanco", PaymentMethod = "Sinpe Movil", Active = true };

        _store[client1.Id] = client1;
        _store[client2.Id] = client2;
        _store[client3.Id] = client3;
        _store[client4.Id] = client4;
    }

    public Task<Client> CreateAsync(Client client, CancellationToken ct = default)
    {
        client.Id = client.Id ?? Guid.NewGuid().ToString();
        client.CreatedAt = DateTime.UtcNow;
        client.UpdatedAt = client.CreatedAt;
        _store[client.Id] = client;
        return Task.FromResult(client);
    }

    public Task<Client?> UpdateAsync(string id, Client client, CancellationToken ct = default)
    {
        if (!_store.ContainsKey(id))
        {
            return Task.FromResult<Client?>(null);
        }
        
        var existing = _store[id];
        existing.FirstName = client.FirstName;
        existing.LastName = client.LastName;
        existing.Phone = client.Phone;
        existing.Email = client.Email;
        existing.Address = client.Address;
        existing.Birthday = client.Birthday;
        existing.Preferences = client.Preferences;
        existing.PaymentMethod = client.PaymentMethod;
        existing.Active = client.Active;
        existing.UpdatedAt = DateTime.UtcNow;
        _store[id] = existing;
        
        return Task.FromResult<Client?>(existing);
    }

    public Task<bool> DeleteAsync(string id, CancellationToken ct = default)
    {
        return Task.FromResult(_store.TryRemove(id, out _));
    }

    public Task<Client?> GetByIdAsync(string id, CancellationToken ct = default)
    {
        _store.TryGetValue(id, out var client);
        return Task.FromResult(client);
    }

    public Task<IEnumerable<Client>> FindAsync(string? query = null, CancellationToken ct = default)
    {
        var clients = _store.Values.AsEnumerable();

        if (string.IsNullOrWhiteSpace(query))
        {
            return Task.FromResult(Enumerable.Empty<Client>());
        }
        
        query = query.Trim().ToLowerInvariant();
        clients = clients.Where(client =>
            client.FirstName.ToLowerInvariant().Contains(query, StringComparison.InvariantCultureIgnoreCase) ||
            client.LastName.ToLowerInvariant().Contains(query, StringComparison.InvariantCultureIgnoreCase) ||
            (client.Phone ?? string.Empty).Contains(query,  StringComparison.InvariantCultureIgnoreCase));
        
        return Task.FromResult(clients);
    }
}
