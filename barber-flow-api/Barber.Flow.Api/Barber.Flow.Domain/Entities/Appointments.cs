namespace Barber.Flow.Domain.Entities;

public class Appointments
{
    public string Id { get; set; } = string.Empty; // APT-0000

    public string ClientName { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public string? ClientId { get; set; }

    /// <summary>yyyy-MM-dd</summary>
    public string Date { get; set; } = string.Empty;

    /// <summary>HH:mm</summary>
    public string Time { get; set; } = string.Empty;

    /// <summary>scheduled | confirmed | completed | cancelled</summary>
    public string Status { get; set; } = "scheduled";

    public DateTime? CompletedAt { get; set; }

    /// <summary>cash | card | sinpeMovil | transfer</summary>
    public string? PaymentMethodUsed { get; set; }

    public string? ServiceName { get; set; }

    public decimal? ServicePrice { get; set; }

    public string? Notes { get; set; }

    public string? ShopId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public string CreatedBy { get; set; } = string.Empty;

    public string UpdatedBy { get; set; } = string.Empty;
}
