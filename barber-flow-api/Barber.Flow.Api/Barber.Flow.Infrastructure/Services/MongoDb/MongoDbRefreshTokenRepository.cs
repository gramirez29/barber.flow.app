using Barber.Flow.Domain.Entities;
using Barber.Flow.Domain.Interfaces;
using MongoDB.Driver;

namespace Barber.Flow.Infrastructure.Services.MongoDb;

public class MongoDbRefreshTokenRepository : IRefreshTokenRepository
{
    private readonly IMongoCollection<RefreshToken> _collection;

    public MongoDbRefreshTokenRepository(IMongoDatabase database)
    {
        _collection = database.GetCollection<RefreshToken>("refresh_tokens");
    }

    public async Task SaveTokenAsync(RefreshToken token)
    {
        await _collection.InsertOneAsync(token);
    }

    public async Task<RefreshToken?> GetValidTokenAsync(string token)
    {
        var filter = Builders<RefreshToken>.Filter.And(
            Builders<RefreshToken>.Filter.Eq(t => t.Token, token),
            Builders<RefreshToken>.Filter.Eq(t => t.IsRevoked, false),
            Builders<RefreshToken>.Filter.Gte(t => t.ExpiresAt, DateTime.UtcNow)
        );

        return await _collection.Find(filter).FirstOrDefaultAsync();
    }

    public async Task RevokeAsync(string tokenId)
    {
        var filter = Builders<RefreshToken>.Filter.Eq(t => t.Id, tokenId);
        var update = Builders<RefreshToken>.Update.Set(t => t.IsRevoked, true);
        await _collection.UpdateOneAsync(filter, update);
    }
}
