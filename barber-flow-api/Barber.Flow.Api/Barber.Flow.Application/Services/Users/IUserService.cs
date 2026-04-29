using Barber.Flow.Domain.Entities;

namespace Barber.Flow.Application.Services.Users;

public interface IUserService
{
    Task<User?> GetAuthenticationUserAsync(string userName, string password, CancellationToken cancellation = default);
    Task<User> CreateAsync(User user, CancellationToken cancellation = default);
    Task<bool> UpdatePasswordAsync(string userName, string newPassword, CancellationToken cancellation = default);
}
