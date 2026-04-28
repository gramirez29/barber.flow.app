using Barber.Flow.Domain.Entities;
using Barber.Flow.Domain.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.Collections;
using System.Collections.Concurrent;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Barber.Flow.Infrastructure.Services.Auth;

public class InMemoryUserRepository() : IUserRepository
{
    private readonly ConcurrentDictionary<string, User> _store = new();

    private readonly IConfiguration? _config;

    public InMemoryUserRepository(IConfiguration config) : this()
    {
        // In real applications, passwords should be hashed and salted
        var user1 = new User { Id = Guid.NewGuid(), Name = "Admin User", UserName = "admin", Password = "password", Email = "admin@example.com", Role = "Admin" };
        var user2 = new User { Id = Guid.NewGuid(), Name = "Barber User", UserName = "barber", Password = "barber", Email = "barber@example.com", Role = "Barber" };

        _store[user1.Name] = user1;
        _store[user2.Name] = user2;

        _config = config;
    }

    public Task<User> CreateAsync(User user, CancellationToken cancellation = default)
    {
        throw new NotImplementedException();
    }

    public Task<bool> DeleteAsync(string id, CancellationToken cancellation = default)
    {
        throw new NotImplementedException();
    }

    public Task<User?> GetAuthenticationUserAsync(string userName, string password, CancellationToken cancellation = default)
    {
        var users = _store.Values.AsEnumerable();
        if (!string.IsNullOrWhiteSpace(userName) && !string.IsNullOrWhiteSpace(password))
        {
            userName = userName.Trim().ToLowerInvariant();
            password = password.Trim().ToLowerInvariant();

            users = users
                .Where(user => user.UserName.ToLowerInvariant() == userName
                && user.Password.Equals(password, StringComparison.InvariantCultureIgnoreCase));
        }

        var user = users.FirstOrDefault();
        if (user != null && string.Equals(user.Password, password, StringComparison.Ordinal))
        {
            user.Token = BuildJwtToken(user.UserName);
        }

        return Task.FromResult(user);
    }

    public Task<User?> UpdateAsync(string id, User user, CancellationToken cancellation = default)
    {
        throw new NotImplementedException();
    }

    private string BuildJwtToken(string username)
    {
        var jwt = _config?.GetSection("Jwt") ?? throw new InvalidOperationException("Jwt configuration not available");
        var key = jwt["Key"] ?? throw new InvalidOperationException("Jwt:Key not configured");
        var issuer = jwt["Issuer"] ?? throw new InvalidOperationException("Jwt:Issuer not configured");
        var audience = jwt["Audience"] ?? throw new InvalidOperationException("Jwt:Audience not configured");
        var expiryMinutes = int.Parse(jwt["ExpiryMinutes"] ?? "60");

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, username),
            new Claim("username", username),
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
