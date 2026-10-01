using Barber.Flow.Domain.Entities;
using Barber.Flow.Domain.Interfaces;

namespace Barber.Flow.Application.Services.Clients;

public class ClientService(IClientRepository repo, IBarberRepository barberRepo) : IClientService
{
    private readonly IClientRepository _repo = repo;
    private readonly IBarberRepository _barberRepo = barberRepo;

    /// <summary>
    /// Throws <see cref="ClientDuplicateException"/> when <paramref name="owner"/> already has another client
    /// with the same (normalized) phone. Scoped per barber: data is private to whoever created it.
    /// </summary>
    private async Task EnsurePhoneIsNotDuplicatedAsync(string owner, string phone, string? excludeId, CancellationToken cancellationToken)
    {
        var normalized = PhoneNormalizer.Normalize(phone);
        if (normalized is null || string.IsNullOrWhiteSpace(owner)) return;

        // A barber's clients are a small set, so comparing normalized phones in memory is enough and
        // avoids storing a derived field (and back-filling it for existing clients).
        var ownClients = await _repo.FindAsync(createdBy: owner, cancellation: cancellationToken);
        var duplicate = ownClients.FirstOrDefault(c =>
            c.Id != excludeId && PhoneNormalizer.Normalize(c.Phone) == normalized);

        if (duplicate is not null)
        {
            throw new ClientDuplicateException(duplicate);
        }
    }

    public async Task<Client> CreateAsync(Client client, CancellationToken cancellationToken = default)
    {
        await EnsurePhoneIsNotDuplicatedAsync(client.CreatedBy, client.Phone, excludeId: null, cancellationToken);

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

        // Only check when the phone actually changed, so duplicates that already exist can still be edited
        // (or fixed by the user) without being blocked by their own twin.
        if (PhoneNormalizer.Normalize(client.Phone) != PhoneNormalizer.Normalize(existing.Phone))
        {
            await EnsurePhoneIsNotDuplicatedAsync(existing.CreatedBy, client.Phone, excludeId: id, cancellationToken);
        }

        // ShopId is set at creation time and must not be reassigned by whoever edits the client later.
        client.ShopId = existing.ShopId;

        return await _repo.UpdateAsync(id, client, cancellationToken);
    }
}
