using Barber.Flow.Domain.Entities;

namespace Barber.Flow.Application.Services.BarberShops;

public interface IBarberShopService
{
    Task<IEnumerable<BarberShop>> GetAllAsync(string userName, int page = 1, int pageSize = 10, CancellationToken cancellationToken = default);
    Task<BarberShop?> GetByIdAsync(string id, string userName, CancellationToken cancellationToken = default);
    Task<BarberShop> CreateAsync(BarberShop barberShop, CancellationToken cancellationToken = default);
    Task<BarberShop> UpdateAsync(BarberShop barberShop, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(string id, string userName, CancellationToken cancellationToken = default);
}
