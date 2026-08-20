using Barber.Flow.Domain.Entities;
using Barber.Flow.Domain.Interfaces;
using Barber.Flow.Infrastructure.Services.Auth;
using Microsoft.Extensions.Configuration;
using MongoDB.Driver;

namespace Barber.Flow.Infrastructure.Services.MongoDb;

public sealed class MongoDbUserRepository : IUserRepository
{
    private readonly IMongoCollection<User> _collection;
    private readonly IConfiguration _config;

    public MongoDbUserRepository(IMongoDatabase database, IConfiguration config)
    {
        _collection = database.GetCollection<User>("users");
        _config = config;
    }

    public async Task<User> CreateAsync(User user, CancellationToken cancellation = default)
    {
        if (!string.IsNullOrEmpty(user.Password) && !PasswordHasher.IsHashed(user.Password))
        {
            user.Password = PasswordHasher.Hash(user.Password);
        }

        await _collection.InsertOneAsync(user, cancellationToken: cancellation);
        return user;
    }

    public Task<User?> UpdateAsync(string id, User user, CancellationToken cancellation = default)
    {
        throw new NotImplementedException();
    }

    public async Task<bool> DeleteAsync(string id, CancellationToken cancellation = default)
    {
        var result = await _collection.DeleteOneAsync(
            Builders<User>.Filter.Eq(u => u.Id, Guid.Parse(id)),
            cancellation);
        return result.DeletedCount > 0;
    }

    public async Task<User?> GetAuthenticationUserAsync(string userName, string password, CancellationToken cancellation = default)
    {
        if (string.IsNullOrWhiteSpace(userName) || string.IsNullOrWhiteSpace(password))
            return null;

        var filter = Builders<User>.Filter.Regex(u => u.UserName,
            new MongoDB.Bson.BsonRegularExpression($"^{System.Text.RegularExpressions.Regex.Escape(userName.Trim())}$", "i"));

        var user = await _collection.Find(filter).FirstOrDefaultAsync(cancellation);
        if (user == null) return null;

        var trimmedPassword = password.Trim();

        if (PasswordHasher.IsHashed(user.Password))
        {
            if (!PasswordHasher.Verify(trimmedPassword, user.Password)) return null;
        }
        else
        {
            // Legacy plain-text password: verify as before, then migrate it to a hash now that
            // we've confirmed it's correct, so it's never stored in plain text again.
            if (!string.Equals(user.Password, trimmedPassword, StringComparison.Ordinal)) return null;

            var hashed = PasswordHasher.Hash(trimmedPassword);
            await _collection.UpdateOneAsync(
                Builders<User>.Filter.Eq(u => u.Id, user.Id),
                Builders<User>.Update.Set(u => u.Password, hashed),
                cancellationToken: cancellation);
            user.Password = hashed;
        }

        user.Token = JwtTokenBuilder.Build(user, _config);
        return user;
    }

    public async Task<User?> GetByIdAsync(Guid id, CancellationToken cancellation = default)
    {
        return await _collection.Find(Builders<User>.Filter.Eq(u => u.Id, id)).FirstOrDefaultAsync(cancellation);
    }

    public async Task<User?> GetByEmailAsync(string email, CancellationToken cancellation = default)
    {
        var filter = Builders<User>.Filter.Regex(u => u.Email,
            new MongoDB.Bson.BsonRegularExpression($"^{System.Text.RegularExpressions.Regex.Escape(email.Trim())}$", "i"));

        return await _collection.Find(filter).FirstOrDefaultAsync(cancellation);
    }

    public async Task<bool> UpdatePasswordAsync(string userName, string newPassword, CancellationToken cancellation = default)
    {
        var filter = Builders<User>.Filter.Regex(u => u.UserName,
            new MongoDB.Bson.BsonRegularExpression($"^{System.Text.RegularExpressions.Regex.Escape(userName.Trim())}$", "i"));
        var update = Builders<User>.Update.Set(u => u.Password, PasswordHasher.Hash(newPassword));

        var result = await _collection.UpdateOneAsync(filter, update, cancellationToken: cancellation);
        return result.ModifiedCount > 0;
    }

    public async Task<User?> GetByUserNameAsync(string userName, CancellationToken cancellation = default)
    {
        var filter = Builders<User>.Filter.Regex(u => u.UserName,
            new MongoDB.Bson.BsonRegularExpression($"^{System.Text.RegularExpressions.Regex.Escape(userName.Trim())}$", "i"));

        return await _collection.Find(filter).FirstOrDefaultAsync(cancellation);
    }

    public async Task<bool> SetBlockedAsync(string id, bool isBlocked, string? actingAdmin, CancellationToken cancellation = default)
    {
        if (!Guid.TryParse(id, out var userId)) return false;

        var update = Builders<User>.Update
            .Set(u => u.IsBlocked, isBlocked)
            .Set(u => u.BlockedAt, isBlocked ? DateTime.UtcNow : null)
            .Set(u => u.BlockedBy, isBlocked ? actingAdmin : null);

        var result = await _collection.UpdateOneAsync(
            Builders<User>.Filter.Eq(u => u.Id, userId),
            update,
            cancellationToken: cancellation);
        return result.MatchedCount > 0;
    }
}
