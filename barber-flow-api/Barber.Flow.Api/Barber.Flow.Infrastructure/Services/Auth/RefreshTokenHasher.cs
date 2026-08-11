using System.Security.Cryptography;
using System.Text;

namespace Barber.Flow.Infrastructure.Services.Auth;

/// <summary>
/// Refresh tokens are high-entropy machine-generated values (not human-chosen secrets), so unlike
/// passwords they don't need BCrypt's salted comparison - a deterministic hash lets lookups keep
/// using equality search while still avoiding plaintext-token storage.
/// </summary>
internal static class RefreshTokenHasher
{
    public static string Hash(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes);
    }
}
