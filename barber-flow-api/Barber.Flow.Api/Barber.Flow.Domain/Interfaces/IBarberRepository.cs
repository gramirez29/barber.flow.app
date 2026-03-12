namespace Barber.Flow.Domain.Interfaces;

public interface IBarberRepository
{
    Task<Entities.Barber> CreateAsync(Entities.Barber barber, CancellationToken cancellation = default);

    Task<Entities.Barber?> UpdateAsync(string id, Entities.Barber barber, CancellationToken cancellation = default);

    Task<bool> DeleteAsync(string id, CancellationToken cancellation = default);

    Task<Entities.Barber?> GetByIdAsync(string id, CancellationToken cancellation = default);

    Task<IEnumerable<Entities.Barber>> FindAsync(string? query = null, CancellationToken cancellation = default);

    Task<string> GetNextIdAsync(CancellationToken cancellation = default);
}
