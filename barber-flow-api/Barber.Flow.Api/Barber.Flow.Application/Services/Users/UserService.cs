using Barber.Flow.Domain.Entities;
using Barber.Flow.Domain.Interfaces;

namespace Barber.Flow.Application.Services.Users;

public class UserService(IUserRepository userRepository) : IUserService
{
    private readonly IUserRepository _repo = userRepository;

    public Task<User?> GetAuthenticationUserAsync(string userName, string password, CancellationToken cancellation = default)
    {
        return _repo.GetAuthenticationUserAsync(userName, password, cancellation);
    }

    public Task<User> CreateAsync(User user, CancellationToken cancellation = default)
    {
        return _repo.CreateAsync(user, cancellation);
    }

    public Task<bool> UpdatePasswordAsync(string userName, string newPassword, CancellationToken cancellation = default)
    {
        return _repo.UpdatePasswordAsync(userName, newPassword, cancellation);
    }
}
