using Barber.Flow.Domain.Entities;
using Barber.Flow.Domain.Interfaces;
using Microsoft.Extensions.Configuration;

namespace Barber.Flow.Infrastructure.Services.Auth;

public class UserTokenBuilder(IConfiguration config) : IUserTokenBuilder
{
    public string Build(User user) => JwtTokenBuilder.Build(user, config);

    public int RefreshTokenExpiryDays =>
        int.Parse(config.GetSection("Jwt")["RefreshTokenExpiryDays"] ?? "30");
}
