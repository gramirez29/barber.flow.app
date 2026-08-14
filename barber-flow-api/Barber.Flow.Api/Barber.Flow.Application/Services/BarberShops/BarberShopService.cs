using Barber.Flow.Domain.Entities;
using Barber.Flow.Domain.Interfaces;

namespace Barber.Flow.Application.Services.BarberShops;

public class BarberShopService(IBarberShopRepository repo) : IBarberShopService
{
    private readonly IBarberShopRepository _repo = repo;

    public Task<IEnumerable<BarberShop>> GetAllAsync(string userName, int page = 1, int pageSize = 10, CancellationToken cancellationToken = default)
    {
        return _repo.GetAllAsync(userName, page, pageSize);
    }

    public Task<BarberShop?> GetByIdAsync(string id, string userName, CancellationToken cancellationToken = default)
    {
        return _repo.GetByIdAsync(id, userName);
    }

    public Task<BarberShop> CreateAsync(BarberShop barberShop, CancellationToken cancellationToken = default)
    {
        return _repo.CreateAsync(barberShop);
    }

    public Task<BarberShop> UpdateAsync(BarberShop barberShop, CancellationToken cancellationToken = default)
    {
        return _repo.UpdateAsync(barberShop);
    }

    public Task<bool> DeleteAsync(string id, string userName, CancellationToken cancellationToken = default)
    {
        return _repo.DeleteAsync(id, userName);
    }
}
