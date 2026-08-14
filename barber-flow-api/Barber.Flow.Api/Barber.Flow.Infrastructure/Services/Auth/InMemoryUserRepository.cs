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
        var user1 = new User { Id = Guid.Parse("1dc8d729-51f9-4633-aaab-46c9273bf44e"), Name = "Admin User", UserName = "admin", Password = PasswordHasher.Hash("password"), Email = "g.raba29@gmail.com", Role = "Admin" };
        var user2 = new User { Id = Guid.NewGuid(), Name = "Barber User", UserName = "barber", Password = PasswordHasher.Hash("barber"), Email = "barber@example.com", Role = "Barber" };

        _store[user1.Name] = user1;
        _store[user2.Name] = user2;

        _config = config;
    }

    public Task<User> CreateAsync(User user, CancellationToken cancellation = default)
    {
        if (!string.IsNullOrEmpty(user.Password) && !PasswordHasher.IsHashed(user.Password))
        {
            user.Password = PasswordHasher.Hash(user.Password);
        }

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
        if (string.IsNullOrWhiteSpace(userName) || string.IsNullOrWhiteSpace(password))
            return Task.FromResult<User?>(null);

        var trimmedUserName = userName.Trim();
        var trimmedPassword = password.Trim();

        var user = _store.Values.FirstOrDefault(u =>
            string.Equals(u.UserName, trimmedUserName, StringComparison.OrdinalIgnoreCase));
        if (user == null) return Task.FromResult<User?>(null);

        bool isValid;
        if (PasswordHasher.IsHashed(user.Password))
        {
            isValid = PasswordHasher.Verify(trimmedPassword, user.Password);
        }
        else
        {
            isValid = string.Equals(user.Password, trimmedPassword, StringComparison.Ordinal);
            if (isValid)
            {
                user.Password = PasswordHasher.Hash(trimmedPassword);
            }
        }

        if (!isValid) return Task.FromResult<User?>(null);

        user.Token = JwtTokenBuilder.Build(user, _config ?? throw new InvalidOperationException("Jwt configuration not available"));
        return Task.FromResult<User?>(user);
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
        existing.Password = PasswordHasher.Hash(newPassword);
        return Task.FromResult(true);
    }
}
