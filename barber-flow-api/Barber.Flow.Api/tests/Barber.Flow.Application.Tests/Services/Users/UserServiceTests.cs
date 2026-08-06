using Barber.Flow.Application.Services.Users;
using Barber.Flow.Domain.Entities;
using Barber.Flow.Domain.Interfaces;
using Moq;

namespace Barber.Flow.Application.Tests.Services.Users;

public class UserServiceTests
{
    private readonly Mock<IUserRepository> _repo = new();
    private readonly Mock<IRefreshTokenRepository> _refreshTokenRepo = new();
    private readonly Mock<IUserTokenBuilder> _tokenBuilder = new();

    public UserServiceTests()
    {
        _tokenBuilder.Setup(t => t.RefreshTokenExpiryDays).Returns(30);
    }

    private UserService CreateSut() => new(_repo.Object, _refreshTokenRepo.Object, _tokenBuilder.Object);

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
    public async Task GetAuthenticationUserAsync_ValidCredentials_IssuesAndPersistsRefreshToken()
    {
        var user = new User { UserName = "admin", Token = "jwt" };
        _repo.Setup(r => r.GetAuthenticationUserAsync("admin", "password", It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        RefreshToken? savedToken = null;
        _refreshTokenRepo.Setup(r => r.SaveTokenAsync(It.IsAny<RefreshToken>()))
            .Callback<RefreshToken>(t => savedToken = t)
            .Returns(Task.CompletedTask);

        var result = await CreateSut().GetAuthenticationUserAsync("admin", "password");

        Assert.NotNull(result!.RefreshToken);
        Assert.NotNull(savedToken);
        Assert.Equal(result.RefreshToken, savedToken!.Token);
        Assert.Equal(user.Id.ToString(), savedToken.UserId);
    }

    [Fact]
    public async Task RefreshAsync_ValidToken_RotatesAndReturnsUserWithNewTokens()
    {
        var user = new User { Id = Guid.NewGuid(), UserName = "admin" };
        var storedToken = new RefreshToken { Id = "token-id", UserId = user.Id.ToString(), Token = "old-refresh" };

        _refreshTokenRepo.Setup(r => r.GetValidTokenAsync("old-refresh")).ReturnsAsync(storedToken);
        _repo.Setup(r => r.GetByIdAsync(user.Id, It.IsAny<CancellationToken>())).ReturnsAsync(user);
        _tokenBuilder.Setup(t => t.Build(user)).Returns("new-jwt");

        var result = await CreateSut().RefreshAsync("old-refresh");

        Assert.NotNull(result);
        Assert.Equal("new-jwt", result!.Token);
        Assert.NotNull(result.RefreshToken);
        Assert.NotEqual("old-refresh", result.RefreshToken);
        _refreshTokenRepo.Verify(r => r.RevokeAsync("token-id"), Times.Once);
    }

    [Fact]
    public async Task RefreshAsync_UnknownOrExpiredToken_ReturnsNull()
    {
        _refreshTokenRepo.Setup(r => r.GetValidTokenAsync("bad-token")).ReturnsAsync((RefreshToken?)null);

        var result = await CreateSut().RefreshAsync("bad-token");

        Assert.Null(result);
    }

    [Fact]
    public async Task RefreshAsync_UserNoLongerExists_ReturnsNull()
    {
        var storedToken = new RefreshToken { Id = "token-id", UserId = Guid.NewGuid().ToString(), Token = "old-refresh" };
        _refreshTokenRepo.Setup(r => r.GetValidTokenAsync("old-refresh")).ReturnsAsync(storedToken);
        _repo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync((User?)null);

        var result = await CreateSut().RefreshAsync("old-refresh");

        Assert.Null(result);
        _refreshTokenRepo.Verify(r => r.RevokeAsync(It.IsAny<string>()), Times.Never);
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
