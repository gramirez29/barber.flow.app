namespace Barber.Flow.Domain.Entities;

public class Client
{
    public string Id { get; set; } = Guid.NewGuid().ToString();

    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty; // "0000-0000"

    /// <summary>
    /// Digits-only form of <see cref="Phone"/> (see <c>PhoneNormalizer</c>), null when the phone has no digits.
    /// Exists so the store can enforce one phone per owner with a unique index.
    /// </summary>
    public string? PhoneNormalized { get; set; }

    public string? Address { get; set; }

    public string? Email { get; set; }

    public DateTime? Birthday { get; set; }

    public string? Preferences { get; set; }

    public string? PaymentMethod { get; set; } // None, Sinpe Movil, Transfer, Cash

    public bool Active { get; set; } = true;

    public string? PhotoUrl { get; set; }

    public string? ShopId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public string CreatedBy { get; set; } = string.Empty;

    public string UpdatedBy { get; set; } = string.Empty;
}
