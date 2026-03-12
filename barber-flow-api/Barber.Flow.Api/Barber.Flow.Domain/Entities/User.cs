namespace Barber.Flow.Domain.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Name { get; set; } = string.Empty;

    public string? Email { get; set; }

    public string UserName { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public string? Role { get; set; } // e.g., Admin, Barber

    public string? Token { get; set; }
}
