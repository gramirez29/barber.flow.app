using Barber.Flow.Domain.Entities;

namespace Barber.Flow.Application.Services.Clients;

public interface IClientService
{
    Task<Client> CreateAsync(Client client, CancellationToken cancellationToken = default);

    Task<Client?> UpdateAsync(string id, Client client, CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(string id, CancellationToken cancellationToken = default);
    Task<IEnumerable<Client>> FindAsync(string? query = null, CancellationToken cancellationToken = default);

    Task<Client?> GetByIdAsync(string id, CancellationToken cancellationToken = default);
}
