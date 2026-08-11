namespace Barber.Flow.Infrastructure.Services.Auth;

/// <summary>
/// Thin wrapper around BCrypt so every password read/write in the app goes through one place.
/// </summary>
public static class PasswordHasher
{
    /// <summary>Hashes a plain-text password for storage.</summary>
    public static string Hash(string password) => BCrypt.Net.BCrypt.HashPassword(password);

    /// <summary>True if the stored value is already a BCrypt hash (starts with "$2") rather than legacy plain text.</summary>
    public static bool IsHashed(string storedPassword) => storedPassword.StartsWith("$2", StringComparison.Ordinal);

    /// <summary>Verifies a plain-text password against a BCrypt hash.</summary>
    public static bool Verify(string password, string hash) => BCrypt.Net.BCrypt.Verify(password, hash);
}
