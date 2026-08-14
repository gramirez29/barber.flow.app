namespace Barber.Flow.Domain.Entities;

public class RefreshToken
{
    public string Id { get; set; } = Guid.NewGuid().ToString();

    public string UserId { get; set; } = string.Empty;

    public string Token { get; set; } = string.Empty;

    public DateTime ExpiresAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public bool IsRevoked { get; set; } = false;

    public bool IsValid() => !IsRevoked && DateTime.UtcNow <= ExpiresAt;
}
