using Barber.Flow.Domain.Entities;

namespace Barber.Flow.Domain.Interfaces;

public interface IClientRepository
{
    Task<Client> CreateAsync(Client client, CancellationToken cancellation = default);

    Task<Client?> UpdateAsync(string id, Client client, CancellationToken cancellation = default);

    Task<bool> DeleteAsync(string id, CancellationToken cancellation = default);

    /// <summary>Permanently deletes every client created by <paramref name="createdBy"/> (account deletion). Returns how many were removed.</summary>
    Task<long> DeleteByCreatorAsync(string createdBy, CancellationToken cancellation = default);

    Task<Client?> GetByIdAsync(string id, CancellationToken cancellation = default);

    Task<IEnumerable<Client>> FindAsync(string? query = null, int? page = null, int? pageSize = null, string? shopId = null, string? createdBy = null, CancellationToken cancellation = default);
}
