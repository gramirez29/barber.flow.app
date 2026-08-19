using System.Security.Cryptography;
using Barber.Flow.Domain.Entities;
using Barber.Flow.Domain.Interfaces;
using Microsoft.Extensions.Configuration;

namespace Barber.Flow.Application.Services.Users;

public class UserService(
    IUserRepository userRepository,
    IRefreshTokenRepository refreshTokenRepository,
    IUserTokenBuilder tokenBuilder,
    IConfiguration configuration) : IUserService
{
    private readonly IUserRepository _repo = userRepository;
    private readonly IRefreshTokenRepository _refreshTokenRepo = refreshTokenRepository;
    private readonly IUserTokenBuilder _tokenBuilder = tokenBuilder;
    private readonly IConfiguration _config = configuration;

    public async Task<User?> GetAuthenticationUserAsync(string userName, string password, CancellationToken cancellation = default)
    {
        var user = await _repo.GetAuthenticationUserAsync(userName, password, cancellation);
        if (user == null)
        {
            return null;
        }

        user.RefreshToken = await IssueRefreshTokenAsync(user.Id.ToString());
        return user;
    }

    public async Task<User?> RefreshAsync(string refreshToken, CancellationToken cancellation = default)
    {
        var stored = await _refreshTokenRepo.GetValidTokenAsync(refreshToken);
        if (stored == null)
        {
            return null;
        }

        if (!Guid.TryParse(stored.UserId, out var userId))
        {
            return null;
        }

        var user = await _repo.GetByIdAsync(userId, cancellation);
        if (user == null)
        {
            return null;
        }

        await _refreshTokenRepo.RevokeAsync(stored.Id);

        user.Token = _tokenBuilder.Build(user);
        user.RefreshToken = await IssueRefreshTokenAsync(user.Id.ToString());
        return user;
    }

    public Task<User> CreateAsync(User user, CancellationToken cancellation = default)
    {
        return _repo.CreateAsync(user, cancellation);
    }

    public Task<bool> UpdatePasswordAsync(string userName, string newPassword, CancellationToken cancellation = default)
    {
        return _repo.UpdatePasswordAsync(userName, newPassword, cancellation);
    }

    public Task<bool> DeleteAsync(string id, CancellationToken cancellation = default)
    {
        return _repo.DeleteAsync(id, cancellation);
    }

    public Task<User?> GetByIdAsync(Guid id, CancellationToken cancellation = default)
    {
        return _repo.GetByIdAsync(id, cancellation);
    }

    // Returns null when the target account may never be blocked (it's the admin account) —
    // enforced here too, not just at the API gate, so no other caller can slip past it.
    public async Task<bool?> SetBlockedAsync(string id, bool isBlocked, string actingAdmin, CancellationToken cancellation = default)
    {
        if (!Guid.TryParse(id, out var userId)) return false;

        var target = await _repo.GetByIdAsync(userId, cancellation);
        if (target == null) return false;

        var adminUsername = _config["BARBERFLOW_ADMIN_USERNAME"] ?? _config["AdminUsername"] ?? "admin";
        var isAdminAccount = string.Equals(target.UserName, adminUsername, StringComparison.OrdinalIgnoreCase)
            || string.Equals(target.Role, "Admin", StringComparison.OrdinalIgnoreCase);
        if (isAdminAccount) return null;

        var updated = await _repo.SetBlockedAsync(id, isBlocked, actingAdmin, cancellation);
        return updated;
    }

    private async Task<string> IssueRefreshTokenAsync(string userId)
    {
        var token = new RefreshToken
        {
            UserId = userId,
            Token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64)),
            ExpiresAt = DateTime.UtcNow.AddDays(_tokenBuilder.RefreshTokenExpiryDays),
        };

        await _refreshTokenRepo.SaveTokenAsync(token);
        return token.Token;
    }
}
