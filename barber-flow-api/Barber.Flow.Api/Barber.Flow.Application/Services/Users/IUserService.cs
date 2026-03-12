using Barber.Flow.Domain.Entities;

namespace Barber.Flow.Application.Services.Users;

public interface IUserService
{
    Task<User?> GetAuthenticationUserAsync(string userName, string password, CancellationToken cancellation = default);
}
