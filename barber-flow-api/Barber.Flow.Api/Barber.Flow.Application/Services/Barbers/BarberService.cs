using Barber.Flow.Domain.Entities;
using Barber.Flow.Domain.Interfaces;

namespace Barber.Flow.Application.Services.Barbers;

public class BarberService(IBarberRepository repo, IBarberShopRepository shopRepo) : IBarberService
{
    private readonly IBarberRepository _repo = repo;
    private readonly IBarberShopRepository _shopRepo = shopRepo;

    public async Task<Domain.Entities.Barber> CreateAsync(Domain.Entities.Barber barber, CancellationToken cancellationToken = default)
    {
        if (!string.IsNullOrWhiteSpace(barber.BarberShopName))
        {
            var shop = await _shopRepo.CreateAsync(new BarberShop
            {
                Name = barber.BarberShopName,
                Phone = barber.BarberShopPhone,
                Address = barber.Address,
                CreatedBy = barber.CreatedBy,
                UpdatedBy = barber.CreatedBy,
            });
            barber.ShopId = shop.Id;
        }

        return await _repo.CreateAsync(barber, cancellationToken);
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

    public async Task<Domain.Entities.Barber?> UpdateAsync(string id, Domain.Entities.Barber barber, CancellationToken cancellationToken = default)
    {
        var existing = await _repo.GetByIdAsync(id, cancellationToken);
        if (existing == null)
        {
            return null;
        }

        // Preserve the barber's existing shop link by default; only touched below
        // when the request actually carries shop-info fields to sync.
        barber.ShopId = existing.ShopId;

        if (!string.IsNullOrWhiteSpace(barber.BarberShopName))
        {
            if (!string.IsNullOrWhiteSpace(existing.ShopId))
            {
                var updatedShop = await _shopRepo.UpdateAsync(new BarberShop
                {
                    Id = existing.ShopId,
                    Name = barber.BarberShopName,
                    Phone = barber.BarberShopPhone,
                    Address = barber.Address,
                    CreatedBy = existing.CreatedBy,
                    UpdatedBy = existing.CreatedBy,
                });
                barber.ShopId = updatedShop.Id;
            }
            else
            {
                var createdShop = await _shopRepo.CreateAsync(new BarberShop
                {
                    Name = barber.BarberShopName,
                    Phone = barber.BarberShopPhone,
                    Address = barber.Address,
                    CreatedBy = existing.CreatedBy,
                    UpdatedBy = existing.CreatedBy,
                });
                barber.ShopId = createdShop.Id;
            }
        }

        return await _repo.UpdateAsync(id, barber, cancellationToken);
    }

    public Task<string> GetNextIdAsync(CancellationToken cancellationToken = default)
    {
        return _repo.GetNextIdAsync(cancellationToken);
    }
}
