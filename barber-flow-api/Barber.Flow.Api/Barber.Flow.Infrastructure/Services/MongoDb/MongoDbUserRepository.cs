using Barber.Flow.Domain.Entities;
using Barber.Flow.Domain.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

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

        user.Token = BuildJwtToken(user);
        return user;
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

    private string BuildJwtToken(User user)
    {
        var jwt = _config.GetSection("Jwt");
        var key = jwt["Key"] ?? throw new InvalidOperationException("Jwt:Key not configured");
        var issuer = jwt["Issuer"] ?? throw new InvalidOperationException("Jwt:Issuer not configured");
        var audience = jwt["Audience"] ?? throw new InvalidOperationException("Jwt:Audience not configured");
        var expiryMinutes = int.Parse(jwt["ExpiryMinutes"] ?? "60");

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.UserName),
            new Claim("username", user.UserName),
            new Claim(JwtRegisteredClaimNames.NameId, user.Id.ToString()),
            new Claim(ClaimTypes.Role, user.Role ?? string.Empty),
        };

        var token = new JwtSecurityToken(
            issuer,
            audience,
            claims,
            expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
