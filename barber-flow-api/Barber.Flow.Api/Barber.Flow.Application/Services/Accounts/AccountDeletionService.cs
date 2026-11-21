using Barber.Flow.Domain.Entities;
using Barber.Flow.Domain.Interfaces;
using Microsoft.Extensions.Configuration;

namespace Barber.Flow.Application.Services.Accounts;

public class AccountDeletionService(
    IUserRepository userRepository,
    IBarberRepository barberRepository,
    IBarberShopRepository barberShopRepository,
    IClientRepository clientRepository,
    IAppointmentRepository appointmentRepository,
    IRefreshTokenRepository refreshTokenRepository,
    IPasswordResetRepository passwordResetRepository,
    IConfiguration configuration) : IAccountDeletionService
{
    public async Task<AccountDeletionResult> DeleteByUserIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        if (!Guid.TryParse(userId, out var id)) return new AccountDeletionResult(AccountDeletionOutcome.NotFound);

        var user = await userRepository.GetByIdAsync(id, cancellationToken);
        if (user is null) return new AccountDeletionResult(AccountDeletionOutcome.NotFound);
        if (IsAdminAccount(user)) return new AccountDeletionResult(AccountDeletionOutcome.Forbidden);

        var barber = await barberRepository.GetByUserNameAsync(user.UserName, cancellationToken);
        return await DeleteEverythingAsync(user, barber, cancellationToken);
    }

    public async Task<AccountDeletionResult> DeleteBarberAsync(string barberId, CancellationToken cancellationToken = default)
    {
        var barber = await barberRepository.GetByIdAsync(barberId, cancellationToken);
        if (barber is null) return new AccountDeletionResult(AccountDeletionOutcome.NotFound);

        var user = string.IsNullOrWhiteSpace(barber.UserName)
            ? null
            : await userRepository.GetByUserNameAsync(barber.UserName, cancellationToken);

        // A Barber record may be linked to the admin login (that is how the admin gets commission
        // settings). Deleting that record must never wipe the admin account or everything the admin
        // created, so only the Barber record itself goes - exactly what happened before this service.
        if (user is not null && IsAdminAccount(user))
        {
            await barberRepository.DeleteAsync(barber.Id, cancellationToken);
            return new AccountDeletionResult(AccountDeletionOutcome.Deleted);
        }

        return await DeleteEverythingAsync(user, barber, cancellationToken);
    }

    // Order matters: the login account goes LAST. If anything fails midway the account still exists,
    // so the owner can sign in and simply try again (every step tolerates already-deleted data).
    private async Task<AccountDeletionResult> DeleteEverythingAsync(User? user, Barber.Flow.Domain.Entities.Barber? barber, CancellationToken cancellationToken)
    {
        // Ownership is the CreatedBy username. The token carries the login's spelling and the barber
        // record may spell it with other casing, so both are cleared (exact match each).
        var owners = new[] { user?.UserName, barber?.UserName }
            .Where(name => !string.IsNullOrWhiteSpace(name))
            .Select(name => name!)
            .Distinct(StringComparer.Ordinal)
            .ToList();

        long appointmentsDeleted = 0;
        long clientsDeleted = 0;
        foreach (var owner in owners)
        {
            appointmentsDeleted += await appointmentRepository.DeleteByCreatorAsync(owner, cancellationToken);
            clientsDeleted += await clientRepository.DeleteByCreatorAsync(owner, cancellationToken);
        }

        if (barber is not null)
        {
            await DeleteShopIfUnsharedAsync(barber, cancellationToken);
            await barberRepository.DeleteAsync(barber.Id, cancellationToken);
        }

        if (user is not null)
        {
            var userId = user.Id.ToString();
            await refreshTokenRepository.DeleteAllForUserAsync(userId);
            await passwordResetRepository.DeleteAllForUserAsync(userId);
            await userRepository.DeleteAsync(userId, cancellationToken);
        }

        return new AccountDeletionResult(AccountDeletionOutcome.Deleted, clientsDeleted, appointmentsDeleted);
    }

    // Every barber gets a shop of their own today, but a shop shared by several barbers must survive
    // the deletion of one of them.
    private async Task DeleteShopIfUnsharedAsync(Barber.Flow.Domain.Entities.Barber barber, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(barber.ShopId)) return;

        var allBarbers = await barberRepository.FindAsync(cancellation: cancellationToken);
        var sharedWithOthers = allBarbers.Any(other => other.Id != barber.Id && other.ShopId == barber.ShopId);
        if (sharedWithOthers) return;

        // The shop is owned by whoever created the barber (the admin), not by the barber.
        await barberShopRepository.DeleteAsync(barber.ShopId, barber.CreatedBy);
    }

    private bool IsAdminAccount(User user)
    {
        var adminUsername = configuration["BARBERFLOW_ADMIN_USERNAME"] ?? configuration["AdminUsername"] ?? "admin";
        return string.Equals(user.UserName, adminUsername, StringComparison.OrdinalIgnoreCase)
            || string.Equals(user.Role, "Admin", StringComparison.OrdinalIgnoreCase);
    }
}
