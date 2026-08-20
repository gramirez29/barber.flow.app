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
        var client5 = new Client { FirstName = "Valeria", LastName = "Ramirez", Phone = "7018-9220", Email = "valeria.ramirez@example.com", Address = "Tres Rios", PaymentMethod = "Cash", Active = true };
        var client6 = new Client { FirstName = "Diana", LastName = "Navarro", Phone = "7018-9220", Email = "diana.navarro@example.com", Address = "Heredia", PaymentMethod = "Sinpe Movil", Active = true };
        var client7 = new Client { FirstName = "Marianela", LastName = "Navarro", Phone = "7018-9220", Email = "marianela.navarro@example.com", Address = "Arenilla", PaymentMethod = "Sinpe Movil", Active = true };
        var client8 = new Client { FirstName = "Felipe", LastName = "Ramirez", Phone = "7018-9220", Email = "felipe.ramirez@example.com", Address = "Arenilla", PaymentMethod = "Cash", Active = true };
        var client9 = new Client { FirstName = "Diego", LastName = "Ureña", Phone = "7018-9220", Email = "diego.urena@example.com", Address = "Paraiso", PaymentMethod = "Sinpe Movil", Active = true };
        var client10 = new Client { FirstName = "Jorge", LastName = "Ortega", Phone = "7018-9220", Email = "jorge.ortega@example.com", Address = "Turrialba", PaymentMethod = "Sinpe Movil", Active = true };
        var client11 = new Client { FirstName = "Pedro", LastName = "Gonzales", Phone = "7018-9220", Email = "pedro.gonzales@example.com", Address = "Tres Rios", PaymentMethod = "Sinpe Movil", Active = true };
        var client12 = new Client { FirstName = "Jonathan", LastName = "Moya", Phone = "7018-9220", Email = "jonathan.moya@example.com", Address = "Pitahaya", PaymentMethod = "Credit Card", Active = true };

        _store[client1.Id] = client1;
        _store[client2.Id] = client2;
        _store[client3.Id] = client3;
        _store[client4.Id] = client4;
        _store[client5.Id] = client5;
        _store[client6.Id] = client6;
        _store[client7.Id] = client7;
        _store[client8.Id] = client8;
        _store[client9.Id] = client9;
        _store[client10.Id] = client10;
        _store[client11.Id] = client11;
        _store[client12.Id] = client12;
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
        existing.PhotoUrl = client.PhotoUrl;
        existing.ShopId = client.ShopId;
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

    public Task<IEnumerable<Client>> FindAsync(string? query = null, int? page = null, int? pageSize = null, string? shopId = null, string? createdBy = null, CancellationToken ct = default)
    {
        var clients = _store.Values.AsEnumerable();

        if (!string.IsNullOrWhiteSpace(query))
        {
            var q = query.Trim().ToLowerInvariant();
            clients = clients.Where(client =>
                client.FirstName.ToLowerInvariant().Contains(q, StringComparison.InvariantCultureIgnoreCase) ||
                client.LastName.ToLowerInvariant().Contains(q, StringComparison.InvariantCultureIgnoreCase) ||
                (client.Phone ?? string.Empty).Contains(q, StringComparison.InvariantCultureIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(shopId))
            clients = clients.Where(client => client.ShopId == shopId);

        if (!string.IsNullOrWhiteSpace(createdBy))
            clients = clients.Where(client => client.CreatedBy == createdBy);

        if (page.HasValue && pageSize.HasValue)
        {
            var ps = Math.Clamp(pageSize.Value, 1, 200);
            var pg = Math.Max(0, page.Value - 1);
            clients = clients.Skip(pg * ps).Take(ps);
        }

        return Task.FromResult(clients);
    }
}
