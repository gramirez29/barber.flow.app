namespace Barber.Flow.Application.Services.Accounts;

public enum AccountDeletionOutcome
{
    /// <summary>The account (and everything it owned) was deleted.</summary>
    Deleted,

    /// <summary>There is no such account/barber.</summary>
    NotFound,

    /// <summary>The target is the admin account, which can never be deleted this way.</summary>
    Forbidden,
}

/// <param name="Outcome">What happened.</param>
/// <param name="ClientsDeleted">Clients removed together with the account.</param>
/// <param name="AppointmentsDeleted">Appointments removed together with the account.</param>
public record AccountDeletionResult(AccountDeletionOutcome Outcome, long ClientsDeleted = 0, long AppointmentsDeleted = 0);

/// <summary>
/// Permanent, whole-account deletion: the login account, the barber profile, its barber shop, every
/// client and appointment it created, and its session/recovery tokens. The privacy policy promises
/// exactly this ("deleting your account erases your profile, client list and appointment history"),
/// so every path that deletes a barber account must go through here.
/// </summary>
public interface IAccountDeletionService
{
    /// <summary>A barber deleting their own account (the logged-in user).</summary>
    Task<AccountDeletionResult> DeleteByUserIdAsync(string userId, CancellationToken cancellationToken = default);

    /// <summary>The admin deleting a barber from the app: removes the barber and its login account too.</summary>
    Task<AccountDeletionResult> DeleteBarberAsync(string barberId, CancellationToken cancellationToken = default);
}
