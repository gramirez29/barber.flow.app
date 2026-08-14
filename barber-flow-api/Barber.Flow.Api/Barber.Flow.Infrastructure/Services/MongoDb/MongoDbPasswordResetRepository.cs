using Barber.Flow.Domain.Entities;
using Barber.Flow.Domain.Interfaces;
using MongoDB.Driver;

namespace Barber.Flow.Infrastructure.Services.MongoDb;

public class MongoDbPasswordResetRepository : IPasswordResetRepository
{
    private readonly IMongoCollection<PasswordResetToken> _collection;

    public MongoDbPasswordResetRepository(IMongoDatabase database)
    {
        _collection = database.GetCollection<PasswordResetToken>("password_reset_tokens");
    }

    public async Task SaveTokenAsync(PasswordResetToken token)
    {
        await _collection.InsertOneAsync(token);
    }

    public async Task<PasswordResetToken?> GetValidTokenAsync(string userId, string otpCode)
    {
        var filter = Builders<PasswordResetToken>.Filter.And(
            Builders<PasswordResetToken>.Filter.Eq(t => t.UserId, userId),
            Builders<PasswordResetToken>.Filter.Eq(t => t.OtpCode, otpCode),
            Builders<PasswordResetToken>.Filter.Eq(t => t.IsUsed, false),
            Builders<PasswordResetToken>.Filter.Gte(t => t.ExpiresAt, DateTime.UtcNow)
        );

        return await _collection.Find(filter).FirstOrDefaultAsync();
    }

    public async Task MarkAsUsedAsync(string tokenId)
    {
        var filter = Builders<PasswordResetToken>.Filter.Eq(t => t.Id, tokenId);
        var update = Builders<PasswordResetToken>.Update.Set(t => t.IsUsed, true);
        await _collection.UpdateOneAsync(filter, update);
    }

    public async Task InvalidateAllForUserAsync(string userId)
    {
        var filter = Builders<PasswordResetToken>.Filter.Eq(t => t.UserId, userId);
        var update = Builders<PasswordResetToken>.Update.Set(t => t.IsUsed, true);
        await _collection.UpdateManyAsync(filter, update);
    }
}