namespace Barber.Flow.Application.Services.Barbers;

public interface IBarberService
{
    Task<Domain.Entities.Barber> CreateAsync(Domain.Entities.Barber barber, CancellationToken cancellationToken = default);

    Task<Domain.Entities.Barber?> UpdateAsync(string id, Domain.Entities.Barber barber, CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(string id, CancellationToken cancellationToken = default);

    Task<IEnumerable<Domain.Entities.Barber>> FindAsync(string? query = null, CancellationToken cancellationToken = default);

    Task<Domain.Entities.Barber?> GetByIdAsync(string id, CancellationToken cancellationToken = default);

    Task<string> GetNextIdAsync(CancellationToken cancellationToken = default);
}
