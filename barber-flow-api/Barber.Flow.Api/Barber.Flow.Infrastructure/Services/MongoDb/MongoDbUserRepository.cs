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
        if (user == null || !string.Equals(user.Password, password.Trim(), StringComparison.Ordinal))
            return null;

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
        var update = Builders<User>.Update.Set(u => u.Password, newPassword);

        var result = await _collection.UpdateOneAsync(filter, update, cancellationToken: cancellation);
        return result.ModifiedCount > 0;
    }
}
