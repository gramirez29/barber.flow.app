using System.Security.Claims;

namespace Barber.Flow.Api.Extensions;

/// <summary>
/// Centralizes reading the caller's identity from the JWT. Deliberately reads the custom
/// "username" claim directly instead of ClaimTypes.NameIdentifier: the JWT also carries "sub"
/// (username) and "nameid" (the user's Guid), and both remap to ClaimTypes.NameIdentifier by
/// ASP.NET's default inbound claim map, so FindFirst(ClaimTypes.NameIdentifier) is ambiguous
/// between the two. "username" is never remapped, so it's the only unambiguous source.
/// </summary>
public static class ClaimsPrincipalExtensions
{
    public static string? GetUserName(this ClaimsPrincipal user) => user.FindFirst("username")?.Value;

    public static bool IsAdmin(this ClaimsPrincipal user) =>
        string.Equals(user.FindFirst(ClaimTypes.Role)?.Value, "Admin", StringComparison.OrdinalIgnoreCase);
}
