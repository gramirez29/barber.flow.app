using Barber.Flow.Domain.Interfaces;
using MongoDB.Bson;
using MongoDB.Driver;
using BarberEntity = Barber.Flow.Domain.Entities.Barber;

namespace Barber.Flow.Infrastructure.Services.MongoDb;

public sealed class MongoDbBarberRepository : IBarberRepository
{
    private readonly IMongoCollection<BarberEntity> _collection;
    private readonly IMongoCollection<BsonCounter> _countersCollection;

    public MongoDbBarberRepository(IMongoDatabase database)
    {
        _collection = database.GetCollection<BarberEntity>("barbers");
        _countersCollection = database.GetCollection<BsonCounter>("counters");
    }

    public async Task<BarberEntity> CreateAsync(BarberEntity barber, CancellationToken cancellation = default)
    {
        if (string.IsNullOrWhiteSpace(barber.Id))
        {
            barber.Id = await GenerateNextIdAsync(cancellation);
        }

        barber.CreatedAt = DateTime.UtcNow;
        barber.UpdatedAt = barber.CreatedAt;
        await _collection.InsertOneAsync(barber, cancellationToken: cancellation);
        return barber;
    }

    public async Task<BarberEntity?> UpdateAsync(string id, BarberEntity barber, CancellationToken cancellation = default)
    {
        var update = Builders<BarberEntity>.Update
            .Set(b => b.UserName, barber.UserName)
            .Set(b => b.UserPhone, barber.UserPhone)
            .Set(b => b.UserEmail, barber.UserEmail)
            .Set(b => b.BarberName, barber.BarberName)
            .Set(b => b.BarberPhone, barber.BarberPhone)
            .Set(b => b.Address, barber.Address)
            .Set(b => b.BarberShopName, barber.BarberShopName)
            .Set(b => b.BarberShopPhone, barber.BarberShopPhone)
            .Set(b => b.PhotoUrl, barber.PhotoUrl)
            .Set(b => b.Settings, barber.Settings)
            .Set(b => b.ShopId, barber.ShopId)
            .Set(b => b.UpdatedAt, DateTime.UtcNow)
            .Set(b => b.UpdatedBy, barber.UpdatedBy);

        return await _collection.FindOneAndUpdateAsync(
            Builders<BarberEntity>.Filter.Eq(b => b.Id, id),
            update,
            new FindOneAndUpdateOptions<BarberEntity> { ReturnDocument = ReturnDocument.After },
            cancellation);
    }

    public async Task<bool> DeleteAsync(string id, CancellationToken cancellation = default)
    {
        var result = await _collection.DeleteOneAsync(
            Builders<BarberEntity>.Filter.Eq(b => b.Id, id),
            cancellation);
        return result.DeletedCount > 0;
    }

    public async Task<BarberEntity?> GetByIdAsync(string id, CancellationToken cancellation = default)
    {
        return await _collection
            .Find(Builders<BarberEntity>.Filter.Eq(b => b.Id, id))
            .FirstOrDefaultAsync(cancellation);
    }

    public async Task<BarberEntity?> GetByUserNameAsync(string userName, CancellationToken cancellation = default)
    {
        var regex = new BsonRegularExpression($"^{System.Text.RegularExpressions.Regex.Escape(userName.Trim())}$", "i");
        return await _collection
            .Find(Builders<BarberEntity>.Filter.Regex(b => b.UserName, regex))
            .FirstOrDefaultAsync(cancellation);
    }

    public async Task<IEnumerable<BarberEntity>> FindAsync(
        string? query = null,
        int? page = null,
        int? pageSize = null,
        CancellationToken cancellation = default)
    {
        var filter = BuildSearchFilter(query);
        // CreatedAt alone isn't a stable sort key: barbers created in the same millisecond
        // tie, and Mongo doesn't guarantee tie order is preserved across separate Skip/Limit
        // queries - Id breaks ties deterministically so paginated pages never overlap or
        // drop a document.
        var findCursor = _collection
            .Find(filter)
            .SortByDescending(b => b.CreatedAt)
            .ThenByDescending(b => b.Id);

        if (page.HasValue && pageSize.HasValue)
            return await findCursor
                .Skip((page.Value - 1) * pageSize.Value)
                .Limit(pageSize.Value)
                .ToListAsync(cancellation);

        return await findCursor.ToListAsync(cancellation);
    }

    public async Task<string> GetNextIdAsync(CancellationToken cancellation = default)
    {
        var filter = Builders<BsonCounter>.Filter.Eq(c => c.Id, "barberId");
        var counter = await _countersCollection.Find(filter).FirstOrDefaultAsync(cancellation);

        var nextValue = counter?.SequenceValue ?? 0;
        return $"CRB-{nextValue:D4}";
    }

    private async Task<string> GenerateNextIdAsync(CancellationToken cancellation = default)
    {
        var filter = Builders<BsonCounter>.Filter.Eq(c => c.Id, "barberId");

        // First try to increment existing counter
        var update = Builders<BsonCounter>.Update.Inc(c => c.SequenceValue, 1);
        var options = new FindOneAndUpdateOptions<BsonCounter>
        {
            ReturnDocument = ReturnDocument.After
        };

        var counter = await _countersCollection.FindOneAndUpdateAsync(filter, update, options, cancellation);

        // If counter didn't exist, create it with initial value 0
        if (counter == null)
        {
            counter = new BsonCounter { Id = "barberId", SequenceValue = 0 };
            try
            {
                await _countersCollection.InsertOneAsync(counter, cancellationToken: cancellation);
            }
            catch (MongoWriteException ex) when (ex.WriteError?.Category == ServerErrorCategory.DuplicateKey)
            {
                // Race condition: another thread created it, try increment again
                counter = await _countersCollection.FindOneAndUpdateAsync(filter, update, options, cancellation);
            }
        }

        return $"CRB-{counter.SequenceValue:D4}";
    }

    private static FilterDefinition<BarberEntity> BuildSearchFilter(string? query)
    {
        if (string.IsNullOrWhiteSpace(query))
            return Builders<BarberEntity>.Filter.Empty;

        var regex = new BsonRegularExpression(System.Text.RegularExpressions.Regex.Escape(query.Trim()), "i");

        return Builders<BarberEntity>.Filter.Or(
            Builders<BarberEntity>.Filter.Regex(b => b.UserName, regex),
            Builders<BarberEntity>.Filter.Regex(b => b.BarberName, regex),
            Builders<BarberEntity>.Filter.Regex(b => b.UserEmail, regex));
    }

    private class BsonCounter
    {
        public string Id { get; set; } = string.Empty;
        public int SequenceValue { get; set; }
    }
}
