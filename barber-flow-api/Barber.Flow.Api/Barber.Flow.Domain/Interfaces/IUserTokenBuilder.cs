using Barber.Flow.Domain.Entities;

namespace Barber.Flow.Domain.Interfaces;

public interface IUserTokenBuilder
{
    string Build(User user);

    int RefreshTokenExpiryDays { get; }
}
