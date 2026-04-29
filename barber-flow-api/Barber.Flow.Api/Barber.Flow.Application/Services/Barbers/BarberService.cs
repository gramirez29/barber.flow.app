using Barber.Flow.Domain.Entities;
using Barber.Flow.Domain.Interfaces;

namespace Barber.Flow.Application.Services.Barbers;

public class BarberService(IBarberRepository repo) : IBarberService
{
    private readonly IBarberRepository _repo = repo;

    public Task<Domain.Entities.Barber> CreateAsync(Domain.Entities.Barber barber, CancellationToken cancellationToken = default)
    {
        return _repo.CreateAsync(barber, cancellationToken);
    }

    public Task<bool> DeleteAsync(string id, CancellationToken cancellationToken = default)
    {
        return _repo.DeleteAsync(id, cancellationToken);
    }

    public Task<IEnumerable<Domain.Entities.Barber>> FindAsync(string? query = null, int? page = null, int? pageSize = null, CancellationToken cancellationToken = default)
    {
        return _repo.FindAsync(query, page, pageSize, cancellationToken);
    }

    public Task<Domain.Entities.Barber?> GetByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        return _repo.GetByIdAsync(id, cancellationToken);
    }

    public Task<Domain.Entities.Barber?> UpdateAsync(string id, Domain.Entities.Barber barber, CancellationToken cancellationToken = default)
    {
        return _repo.UpdateAsync(id, barber, cancellationToken);
    }

    public Task<string> GetNextIdAsync(CancellationToken cancellationToken = default)
    {
        return _repo.GetNextIdAsync(cancellationToken);
    }
}
