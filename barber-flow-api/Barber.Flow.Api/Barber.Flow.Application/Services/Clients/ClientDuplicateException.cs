using Barber.Flow.Domain.Entities;

namespace Barber.Flow.Application.Services.Clients;

/// <summary>
/// Raised when the barber already has a client with the same phone number (compared normalized).
/// Carries the existing client so the UI can point the user to it.
/// </summary>
public class ClientDuplicateException(Client existingClient)
    : Exception($"Ya tienes un cliente con este teléfono: {existingClient.FirstName} {existingClient.LastName}".TrimEnd())
{
    public const string DuplicatePhoneCode = "CLIENT_DUPLICATE_PHONE";

    public string Code => DuplicatePhoneCode;

    public Client ExistingClient { get; } = existingClient;
}
