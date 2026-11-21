namespace Barber.Flow.Domain.Exceptions;

/// <summary>
/// Raised when a barber would end up with a username (compared case-insensitively) that another
/// barber already has. The username is the tenant identity every appointment/client is owned by
/// (CreatedBy), so two barbers sharing one would also share each other's data lookups.
/// Thrown by the service's pre-check and by the repository when the unique index rejects a racing write.
/// </summary>
public class BarberUserNameConflictException(string? userName, Exception? inner = null)
    : Exception($"Ya existe un barbero con el usuario '{userName}'.", inner)
{
    public const string ErrorCode = "BARBER_DUPLICATE_USERNAME";

    public string? UserName { get; } = userName;

    public string Code => ErrorCode;
}
