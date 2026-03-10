using Barber.Flow.Domain.Interfaces;
using Barber.Flow.Domain.ValueObjects;
using Barber.Flow.Infrastructure.Services.Auth.DTOs;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Barber.Flow.Infrastructure.Services.Auth;

public class JwtAuthService : IJwtAuthService
{
    private readonly IConfiguration _config;

    public JwtAuthService(IConfiguration config) => _config = config;

    public Task<AuthResult?> GetJsonWebTokenAsync(string userOrEmail, string password, CancellationToken cancellationToken = default)
    {
        // TODO: replace with real user store / password hashing
        if ((userOrEmail == "admin" || userOrEmail == "admin@example.com") && password == "password")
        {
            var username = userOrEmail.Contains('@') ? "admin" : userOrEmail;
            var token = BuildJwtToken(username);
            return Task.FromResult<AuthResult?>(new AuthResult(username, token));
        }

        return Task.FromResult<AuthResult?>(null);
    }

    private string BuildJwtToken(string username)
    {
        var jwt = _config.GetSection("Jwt");
        var key = jwt["Key"] ?? throw new InvalidOperationException("Jwt:Key not configured");
        var issuer = jwt["Issuer"] ?? throw new InvalidOperationException("Jwt:Issuer not configured");
        var audience = jwt["Audience"] ?? throw new InvalidOperationException("Jwt:Audience not configured");
        var expiryMinutes = int.Parse(jwt["ExpiryMinutes"] ?? "60");

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, username),
            new Claim("username", username),
        };

        var token = new JwtSecurityToken(
            issuer,
            audience,
            claims,
            expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}