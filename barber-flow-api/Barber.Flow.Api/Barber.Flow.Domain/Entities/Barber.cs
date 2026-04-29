namespace Barber.Flow.Domain.Entities;

public class Barber
{
    public string Id { get; set; } = string.Empty; // CRB-0000

    public string UserName { get; set; } = string.Empty;

    public string UserPhone { get; set; } = string.Empty;

    public string UserEmail { get; set; } = string.Empty;

    public string BarberName { get; set; } = string.Empty;

    public string BarberPhone { get; set; } = string.Empty;

    public string? Address { get; set; }

    public string? BarberShopName { get; set; }

    public string? BarberShopPhone { get; set; }

    public string? PhotoUrl { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public string CreatedBy { get; set; } = string.Empty;

    public string UpdatedBy { get; set; } = string.Empty;
}
