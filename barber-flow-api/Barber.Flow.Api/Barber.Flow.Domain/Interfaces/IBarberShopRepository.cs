using Barber.Flow.Domain.Entities;

namespace Barber.Flow.Domain.Interfaces;

public interface IBarberShopRepository
{
    Task<IEnumerable<BarberShop>> GetAllAsync(string userName, int page = 1, int pageSize = 10);
    Task<BarberShop?> GetByIdAsync(string id, string userName);
    Task<BarberShop> CreateAsync(BarberShop barberShop);
    Task<BarberShop> UpdateAsync(BarberShop barberShop);
    Task<bool> DeleteAsync(string id, string userName);
    Task<string> GetNextIdAsync();
}
