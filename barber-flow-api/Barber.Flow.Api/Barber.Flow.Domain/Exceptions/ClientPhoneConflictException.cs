namespace Barber.Flow.Domain.Exceptions;

/// <summary>
/// Raised by a client repository when the store itself rejects a write because the owner already
/// has another client with the same normalized phone (unique index). This is the safety net for
/// two simultaneous requests that both passed the service-level duplicate check.
/// </summary>
public class ClientPhoneConflictException(string? phoneNormalized, Exception? inner = null)
    : Exception("A client with the same phone already exists for this owner.", inner)
{
    public string? PhoneNormalized { get; } = phoneNormalized;
}
