using Barber.Flow.Domain.Entities;
using Barber.Flow.Domain.Interfaces;
using MongoDB.Driver;

namespace Barber.Flow.Infrastructure.Services.MongoDb;

public sealed class MongoDbBarberShopRepository : IBarberShopRepository
{
    private readonly IMongoCollection<BarberShop> _collection;
    private readonly IMongoCollection<BsonCounter> _countersCollection;

    public MongoDbBarberShopRepository(IMongoDatabase database)
    {
        _collection = database.GetCollection<BarberShop>("barberShops");
        _countersCollection = database.GetCollection<BsonCounter>("counters");
    }

    public async Task<IEnumerable<BarberShop>> GetAllAsync(string userName, int page = 1, int pageSize = 10)
    {
        var filter = Builders<BarberShop>.Filter.Eq(s => s.CreatedBy, userName);
        return await _collection
            .Find(filter)
            .SortByDescending(s => s.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Limit(pageSize)
            .ToListAsync();
    }

    public async Task<BarberShop?> GetByIdAsync(string id, string userName)
    {
        var filter = Builders<BarberShop>.Filter.And(
            Builders<BarberShop>.Filter.Eq(s => s.Id, id),
            Builders<BarberShop>.Filter.Eq(s => s.CreatedBy, userName)
        );
        return await _collection.Find(filter).FirstOrDefaultAsync();
    }

    public async Task<BarberShop> CreateAsync(BarberShop barberShop)
    {
        barberShop.Id = await GetNextIdAsync();
        barberShop.CreatedAt = DateTime.UtcNow;
        barberShop.UpdatedAt = barberShop.CreatedAt;
        await _collection.InsertOneAsync(barberShop);
        return barberShop;
    }

    public async Task<BarberShop> UpdateAsync(BarberShop barberShop)
    {
        var filter = Builders<BarberShop>.Filter.And(
            Builders<BarberShop>.Filter.Eq(s => s.Id, barberShop.Id),
            Builders<BarberShop>.Filter.Eq(s => s.CreatedBy, barberShop.UpdatedBy)
        );

        var update = Builders<BarberShop>.Update
            .Set(s => s.Name, barberShop.Name)
            .Set(s => s.Phone, barberShop.Phone)
            .Set(s => s.Address, barberShop.Address)
            .Set(s => s.UpdatedAt, DateTime.UtcNow)
            .Set(s => s.UpdatedBy, barberShop.UpdatedBy);

        var result = await _collection.FindOneAndUpdateAsync(
            filter,
            update,
            new FindOneAndUpdateOptions<BarberShop> { ReturnDocument = ReturnDocument.After }
        );

        if (result == null)
            throw new InvalidOperationException($"BarberShop with ID {barberShop.Id} not found or unauthorized.");

        return result;
    }

    public async Task<bool> DeleteAsync(string id, string userName)
    {
        var filter = Builders<BarberShop>.Filter.And(
            Builders<BarberShop>.Filter.Eq(s => s.Id, id),
            Builders<BarberShop>.Filter.Eq(s => s.CreatedBy, userName)
        );
        var result = await _collection.DeleteOneAsync(filter);
        return result.DeletedCount > 0;
    }

    public async Task<string> GetNextIdAsync()
    {
        var filter = Builders<BsonCounter>.Filter.Eq(c => c.Id, "barberShopId");
        var update = Builders<BsonCounter>.Update.Inc(c => c.SequenceValue, 1);
        var options = new FindOneAndUpdateOptions<BsonCounter>
        {
            IsUpsert = true,
            ReturnDocument = ReturnDocument.After
        };

        var counter = await _countersCollection.FindOneAndUpdateAsync(filter, update, options);
        return $"SHOP-{counter.SequenceValue:D4}";
    }

    private class BsonCounter
    {
        public string Id { get; set; } = string.Empty;
        public int SequenceValue { get; set; }
    }
}
