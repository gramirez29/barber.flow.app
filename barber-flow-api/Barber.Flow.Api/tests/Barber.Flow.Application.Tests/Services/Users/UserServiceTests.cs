using Barber.Flow.Application.Services.Users;
using Barber.Flow.Domain.Entities;
using Barber.Flow.Domain.Interfaces;
using Moq;

namespace Barber.Flow.Application.Tests.Services.Users;

public class UserServiceTests
{
    private readonly Mock<IUserRepository> _repo = new();

    private UserService CreateSut() => new(_repo.Object);

    [Fact]
    public async Task GetAuthenticationUserAsync_InvalidCredentials_ReturnsNull()
    {
        _repo.Setup(r => r.GetAuthenticationUserAsync("admin", "wrong", It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        var result = await CreateSut().GetAuthenticationUserAsync("admin", "wrong");

        Assert.Null(result);
    }

    [Fact]
    public async Task GetAuthenticationUserAsync_ValidCredentials_ReturnsUser()
    {
        var user = new User { UserName = "admin", Token = "jwt" };
        _repo.Setup(r => r.GetAuthenticationUserAsync("admin", "password", It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        var result = await CreateSut().GetAuthenticationUserAsync("admin", "password");

        Assert.Same(user, result);
    }

    [Fact]
    public async Task CreateAsync_DelegatesToRepositoryAndReturnsItsResult()
    {
        var user = new User { UserName = "barber1" };
        _repo.Setup(r => r.CreateAsync(user, It.IsAny<CancellationToken>())).ReturnsAsync(user);

        var result = await CreateSut().CreateAsync(user);

        Assert.Same(user, result);
    }

    [Fact]
    public async Task UpdatePasswordAsync_DelegatesToRepositoryAndReturnsItsResult()
    {
        _repo.Setup(r => r.UpdatePasswordAsync("barber1", "new-password", It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var result = await CreateSut().UpdatePasswordAsync("barber1", "new-password");

        Assert.True(result);
    }

    [Fact]
    public async Task DeleteAsync_UserNotFound_ReturnsFalse()
    {
        _repo.Setup(r => r.DeleteAsync("missing-id", It.IsAny<CancellationToken>())).ReturnsAsync(false);

        var result = await CreateSut().DeleteAsync("missing-id");

        Assert.False(result);
    }
}
