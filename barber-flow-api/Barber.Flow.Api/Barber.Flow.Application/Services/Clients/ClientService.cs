using Barber.Flow.Domain.Entities;
using Barber.Flow.Domain.Interfaces;

namespace Barber.Flow.Application.Services.Clients;

public class ClientService(IClientRepository repo) : IClientService
{
    private readonly IClientRepository _repo = repo;

    public Task<Client> CreateAsync(Client client, CancellationToken cancellationToken = default)
    {
        return _repo.CreateAsync(client, cancellationToken);
    }

    public Task<bool> DeleteAsync(string id, CancellationToken cancellationToken = default)
    {
        return _repo.DeleteAsync(id, cancellationToken);
    }

    public Task<IEnumerable<Client>> FindAsync(string? query = null, CancellationToken cancellationToken = default)
    {
        return _repo.FindAsync(query, cancellationToken);
    }

    public Task<Client?> GetByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        return _repo.GetByIdAsync(id, cancellationToken);
    }

    public Task<Client?> UpdateAsync(string id, Client client, CancellationToken cancellationToken = default)
    {
        return _repo.UpdateAsync(id, client, cancellationToken);
    }
}
