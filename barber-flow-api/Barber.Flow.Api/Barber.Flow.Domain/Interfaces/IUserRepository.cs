namespace Barber.Flow.Domain.Interfaces;

public interface IUserRepository
{
        Task<Entities.User> CreateAsync(Entities.User user, CancellationToken cancellation = default);
    
        Task<Entities.User?> UpdateAsync(string id, Entities.User user, CancellationToken cancellation = default);
    
        Task<bool> DeleteAsync(string id, CancellationToken cancellation = default);
    
        Task<Entities.User?> GetAuthenticationUserAsync(string userName, string password, CancellationToken cancellation = default);

        Task<Entities.User?> GetByIdAsync(Guid id, CancellationToken cancellation = default);

        Task<Entities.User?> GetByEmailAsync(string email, CancellationToken cancellation = default);

        Task<Entities.User?> GetByUserNameAsync(string userName, CancellationToken cancellation = default);

        Task<bool> UpdatePasswordAsync(string userName, string newPassword, CancellationToken cancellation = default);

        Task<bool> SetBlockedAsync(string id, bool isBlocked, string? actingAdmin, CancellationToken cancellation = default);
}
