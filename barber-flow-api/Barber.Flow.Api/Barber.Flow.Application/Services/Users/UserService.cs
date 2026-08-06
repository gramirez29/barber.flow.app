using System.Security.Cryptography;
using Barber.Flow.Domain.Entities;
using Barber.Flow.Domain.Interfaces;

namespace Barber.Flow.Application.Services.Users;

public class UserService(
    IUserRepository userRepository,
    IRefreshTokenRepository refreshTokenRepository,
    IUserTokenBuilder tokenBuilder) : IUserService
{
    private readonly IUserRepository _repo = userRepository;
    private readonly IRefreshTokenRepository _refreshTokenRepo = refreshTokenRepository;
    private readonly IUserTokenBuilder _tokenBuilder = tokenBuilder;

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
