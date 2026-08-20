using Barber.Flow.Domain.Entities;
using Barber.Flow.Domain.Interfaces;

namespace Barber.Flow.Application.Services.Clients;

public class ClientService(IClientRepository repo, IBarberRepository barberRepo) : IClientService
{
    private readonly IClientRepository _repo = repo;
    private readonly IBarberRepository _barberRepo = barberRepo;

    public async Task<Client> CreateAsync(Client client, CancellationToken cancellationToken = default)
    {
        // ShopId identifies the tenant a client belongs to; it's derived from the
        // creating barber's own shop unless the caller already supplied one explicitly.
        if (string.IsNullOrWhiteSpace(client.ShopId) && !string.IsNullOrWhiteSpace(client.CreatedBy))
        {
            var barber = await _barberRepo.GetByUserNameAsync(client.CreatedBy, cancellationToken);
            client.ShopId = barber?.ShopId;
        }

        return await _repo.CreateAsync(client, cancellationToken);
    }

    public Task<bool> DeleteAsync(string id, CancellationToken cancellationToken = default)
    {
        return _repo.DeleteAsync(id, cancellationToken);
    }

    public Task<IEnumerable<Client>> FindAsync(string? query = null, int? page = null, int? pageSize = null, string? shopId = null, string? createdBy = null, CancellationToken cancellationToken = default)
    {
        return _repo.FindAsync(query, page, pageSize, shopId, createdBy, cancellationToken);
    }

    public Task<Client?> GetByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        return _repo.GetByIdAsync(id, cancellationToken);
    }

    public async Task<Client?> UpdateAsync(string id, Client client, CancellationToken cancellationToken = default)
    {
        var existing = await _repo.GetByIdAsync(id, cancellationToken);
        if (existing == null)
        {
            return null;
        }

        // ShopId is set at creation time and must not be reassigned by whoever edits the client later.
        client.ShopId = existing.ShopId;

        return await _repo.UpdateAsync(id, client, cancellationToken);
    }
}
