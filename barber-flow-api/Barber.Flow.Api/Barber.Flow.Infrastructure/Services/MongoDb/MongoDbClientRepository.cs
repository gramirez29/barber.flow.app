using Barber.Flow.Domain.Entities;
using Barber.Flow.Domain.Interfaces;
using MongoDB.Bson;
using MongoDB.Driver;
using System.Text.RegularExpressions;

namespace Barber.Flow.Infrastructure.Services.MongoDb;

public sealed class MongoDbClientRepository : IClientRepository
{
    private readonly IMongoCollection<Client> _collection;

    public MongoDbClientRepository(IMongoDatabase database)
    {
        _collection = database.GetCollection<Client>("clients");
    }

    public async Task<Client> CreateAsync(Client client, CancellationToken cancellation = default)
    {
        await _collection.InsertOneAsync(client, cancellationToken: cancellation);
        return client;
    }

    public async Task<Client?> UpdateAsync(string id, Client client, CancellationToken cancellation = default)
    {
        var update = Builders<Client>.Update
            .Set(c => c.FirstName, client.FirstName)
            .Set(c => c.LastName, client.LastName)
            .Set(c => c.Phone, client.Phone)
            .Set(c => c.Email, client.Email)
            .Set(c => c.Address, client.Address)
            .Set(c => c.Birthday, client.Birthday)
            .Set(c => c.Preferences, client.Preferences)
            .Set(c => c.PaymentMethod, client.PaymentMethod)
            .Set(c => c.Active, client.Active)
            .Set(c => c.PhotoUrl, client.PhotoUrl)
            .Set(c => c.ShopId, client.ShopId)
            .Set(c => c.UpdatedAt, DateTime.UtcNow);

        return await _collection.FindOneAndUpdateAsync(
            Builders<Client>.Filter.Eq(c => c.Id, id),
            update,
            new FindOneAndUpdateOptions<Client> { ReturnDocument = ReturnDocument.After },
            cancellation);
    }

    public async Task<bool> DeleteAsync(string id, CancellationToken cancellation = default)
    {
        var result = await _collection.DeleteOneAsync(
            Builders<Client>.Filter.Eq(c => c.Id, id),
            cancellation);
        return result.DeletedCount > 0;
    }

    public async Task<Client?> GetByIdAsync(string id, CancellationToken cancellation = default)
    {
        return await _collection
            .Find(Builders<Client>.Filter.Eq(c => c.Id, id))
            .FirstOrDefaultAsync(cancellation);
    }

    public async Task<IEnumerable<Client>> FindAsync(
        string? query = null,
        int? page = null,
        int? pageSize = null,
        string? shopId = null,
        CancellationToken cancellation = default)
    {
        var filter = BuildSearchFilter(query, shopId);
        // CreatedAt alone isn't a stable sort key: clients created in the same millisecond
        // (e.g. bulk-created in a loop) tie, and Mongo doesn't guarantee tie order is
        // preserved across separate Skip/Limit queries - Id breaks ties deterministically
        // so paginated pages never overlap or drop a document.
        var findCursor = _collection
            .Find(filter)
            .SortByDescending(c => c.CreatedAt)
            .ThenByDescending(c => c.Id);

        if (page.HasValue && pageSize.HasValue)
        {
            var ps = Math.Clamp(pageSize.Value, 1, 200);
            var pg = Math.Max(0, page.Value - 1);
            return await findCursor
                .Skip(pg * ps)
                .Limit(ps)
                .ToListAsync(cancellation);
        }

        return await findCursor.ToListAsync(cancellation);
    }

    private static FilterDefinition<Client> BuildSearchFilter(string? query, string? shopId)
    {
        var filters = new List<FilterDefinition<Client>>();

        if (!string.IsNullOrWhiteSpace(query))
        {
            // Case-insensitive regex; escape input to prevent regex injection
            var regex = new BsonRegularExpression(Regex.Escape(query.Trim()), "i");
            filters.Add(Builders<Client>.Filter.Or(
                Builders<Client>.Filter.Regex(c => c.FirstName, regex),
                Builders<Client>.Filter.Regex(c => c.LastName, regex),
                Builders<Client>.Filter.Regex(c => c.Phone, regex)));
        }

        if (!string.IsNullOrWhiteSpace(shopId))
        {
            filters.Add(Builders<Client>.Filter.Eq(c => c.ShopId, shopId));
        }

        return filters.Count > 0 ? Builders<Client>.Filter.And(filters) : Builders<Client>.Filter.Empty;
    }
}
