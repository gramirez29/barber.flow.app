using Barber.Flow.Domain.Entities;
using Barber.Flow.Domain.Interfaces;
using Microsoft.Extensions.Configuration;
using System.Collections;
using System.Collections.Concurrent;

namespace Barber.Flow.Infrastructure.Services.Auth;

public class InMemoryUserRepository() : IUserRepository
{
    private readonly ConcurrentDictionary<string, User> _store = new();

    private readonly IConfiguration? _config;

    public InMemoryUserRepository(IConfiguration config) : this()
    {
        // In real applications, passwords should be hashed and salted
        var user1 = new User { Id = Guid.Parse("1dc8d729-51f9-4633-aaab-46c9273bf44e"), Name = "Admin User", UserName = "admin", Password = "password", Email = "g.raba29@gmail.com", Role = "Admin" };
        var user2 = new User { Id = Guid.NewGuid(), Name = "Barber User", UserName = "barber", Password = "barber", Email = "barber@example.com", Role = "Barber" };

        _store[user1.Name] = user1;
        _store[user2.Name] = user2;

        _config = config;
    }

    public Task<User> CreateAsync(User user, CancellationToken cancellation = default)
    {
        _store[user.UserName] = user;
        return Task.FromResult(user);
    }

    public Task<bool> DeleteAsync(string id, CancellationToken cancellation = default)
    {
        var entry = _store.FirstOrDefault(kv => kv.Value.Id.ToString() == id);
        if (entry.Key is null) return Task.FromResult(false);
        return Task.FromResult(_store.TryRemove(entry.Key, out _));
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
            user.Token = JwtTokenBuilder.Build(user, _config ?? throw new InvalidOperationException("Jwt configuration not available"));
        }

        return Task.FromResult(user);
    }

    public Task<User?> GetByIdAsync(Guid id, CancellationToken cancellation = default)
    {
        return Task.FromResult(_store.Values.FirstOrDefault(u => u.Id == id));
    }

    public Task<User?> GetByEmailAsync(string email, CancellationToken cancellation = default)
    {
        var user = _store.Values.FirstOrDefault(u => 
            string.Equals(u.Email, email, StringComparison.OrdinalIgnoreCase));
        return Task.FromResult(user);
    }

    public Task<User?> UpdateAsync(string id, User user, CancellationToken cancellation = default)
    {
        throw new NotImplementedException();
    }

    public Task<bool> UpdatePasswordAsync(string userName, string newPassword, CancellationToken cancellation = default)
    {
        var existing = _store.Values.FirstOrDefault(u =>
            string.Equals(u.UserName, userName, StringComparison.OrdinalIgnoreCase));
        if (existing == null) return Task.FromResult(false);
        existing.Password = newPassword;
        return Task.FromResult(true);
    }
}
