using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Barber.Flow.Domain.Interfaces;

namespace Barber.Flow.Api.Middleware;

// Corta con 403 cualquier request autenticado de una cuenta bloqueada por falta de pago.
// Debe registrarse después de UseAuthentication()/UseAuthorization() y antes de mapear las
// rutas, para que solo inspeccione requests que ya pasaron la validación del JWT.
public sealed class BlockedUserMiddleware(RequestDelegate next)
{
    private readonly RequestDelegate _next = next;

    // Rutas que deben seguir siendo alcanzables incluso para una cuenta bloqueada: login,
    // refresh, recuperación de contraseña, y el propio endpoint de estado que usan ambas
    // apps para detectar el bloqueo (si este quedara bloqueado, el cliente nunca podría
    // saber por qué dejó de funcionar).
    private static readonly string[] ExemptPathPrefixes =
    [
        "/api/users/authentication",
        "/api/users/refresh",
        "/api/users/me/status",
        "/api/auth/",
        "/swagger",
    ];

    public async Task InvokeAsync(HttpContext context, IUserRepository userRepository)
    {
        if (context.User.Identity?.IsAuthenticated != true)
        {
            await _next(context);
            return;
        }

        var path = context.Request.Path.Value ?? string.Empty;
        if (ExemptPathPrefixes.Any(prefix => path.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)))
        {
            await _next(context);
            return;
        }

        var userId = context.User.Claims
            .Where(c => c.Type == ClaimTypes.NameIdentifier || c.Type == JwtRegisteredClaimNames.NameId)
            .Select(c => c.Value)
            .FirstOrDefault(value => Guid.TryParse(value, out _));

        if (userId == null || !Guid.TryParse(userId, out var guid))
        {
            await _next(context);
            return;
        }

        var user = await userRepository.GetByIdAsync(guid, context.RequestAborted);
        if (user is { IsBlocked: true })
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new
            {
                code = "ACCOUNT_BLOCKED",
                message = "Cuenta bloqueada por falta de pago. Contacta al administrador."
            });
            return;
        }

        await _next(context);
    }
}
