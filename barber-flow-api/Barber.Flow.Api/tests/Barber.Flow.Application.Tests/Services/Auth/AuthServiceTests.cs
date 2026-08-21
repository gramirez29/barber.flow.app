using Barber.Flow.Application.Services.Auth;
using Barber.Flow.Domain.Entities;
using Barber.Flow.Domain.Interfaces;
using Microsoft.Extensions.Logging;
using Moq;

namespace Barber.Flow.Application.Tests.Services.Auth;

public class AuthServiceTests
{
    private readonly Mock<IUserRepository> _userRepository = new();
    private readonly Mock<IPasswordResetRepository> _passwordResetRepository = new();
    private readonly Mock<IEmailService> _emailService = new();
    private readonly Mock<ILogger<AuthService>> _logger = new();

    private AuthService CreateSut() => new(
        _userRepository.Object,
        _passwordResetRepository.Object,
        _emailService.Object,
        _logger.Object);

    private static User BuildUser(string email = "barber@example.com") => new()
    {
        Id = Guid.NewGuid(),
        Name = "Test Barber",
        UserName = "testbarber",
        Password = "old-password",
        Email = email,
        Role = "Barber",
    };

    [Fact]
    public async Task RequestPasswordResetAsync_UserNotFound_ReturnsFalseAndSendsNoEmail()
    {
        _userRepository
            .Setup(r => r.GetByEmailAsync("missing@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        var result = await CreateSut().RequestPasswordResetAsync("missing@example.com");

        Assert.False(result);
        _passwordResetRepository.Verify(r => r.InvalidateAllForUserAsync(It.IsAny<string>()), Times.Never);
        _passwordResetRepository.Verify(r => r.SaveTokenAsync(It.IsAny<PasswordResetToken>()), Times.Never);
        _emailService.Verify(e => e.SendEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<bool>()), Times.Never);
    }

    [Fact]
    public async Task RequestPasswordResetAsync_UserFound_InvalidatesPreviousTokensSavesNewTokenAndSendsEmail()
    {
        var user = BuildUser();
        _userRepository
            .Setup(r => r.GetByEmailAsync(user.Email!, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        PasswordResetToken? savedToken = null;
        _passwordResetRepository
            .Setup(r => r.SaveTokenAsync(It.IsAny<PasswordResetToken>()))
            .Callback<PasswordResetToken>(t => savedToken = t)
            .Returns(Task.CompletedTask);

        var result = await CreateSut().RequestPasswordResetAsync(user.Email!);

        Assert.True(result);
        _passwordResetRepository.Verify(r => r.InvalidateAllForUserAsync(user.Id.ToString()), Times.Once);
        Assert.NotNull(savedToken);
        Assert.Equal(user.Id.ToString(), savedToken!.UserId);
        Assert.Equal(6, savedToken.OtpCode.Length);
        Assert.True(int.TryParse(savedToken.OtpCode, out _));
        _emailService.Verify(e => e.SendEmailAsync(user.Email!, It.IsAny<string>(), It.IsAny<string>(), true), Times.Once);
    }

    [Fact]
    public async Task RequestPasswordResetAsync_EmailSendFails_InvalidatesTokenAndReturnsFalse()
    {
        var user = BuildUser();
        _userRepository
            .Setup(r => r.GetByEmailAsync(user.Email!, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _emailService
            .Setup(e => e.SendEmailAsync(user.Email!, It.IsAny<string>(), It.IsAny<string>(), true))
            .ThrowsAsync(new InvalidOperationException("SMTP unavailable"));

        var result = await CreateSut().RequestPasswordResetAsync(user.Email!);

        Assert.False(result);
        _passwordResetRepository.Verify(r => r.InvalidateAllForUserAsync(user.Id.ToString()), Times.Exactly(2));
    }

    [Fact]
    public async Task VerifyOtpAsync_UserNotFound_ReturnsFalse()
    {
        _userRepository
            .Setup(r => r.GetByEmailAsync("missing@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        var result = await CreateSut().VerifyOtpAsync("missing@example.com", "123456");

        Assert.False(result);
        _passwordResetRepository.Verify(r => r.GetValidTokenAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task VerifyOtpAsync_NoValidToken_ReturnsFalse()
    {
        var user = BuildUser();
        _userRepository
            .Setup(r => r.GetByEmailAsync(user.Email!, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _passwordResetRepository
            .Setup(r => r.GetValidTokenAsync(user.Id.ToString(), "000000"))
            .ReturnsAsync((PasswordResetToken?)null);

        var result = await CreateSut().VerifyOtpAsync(user.Email!, "000000");

        Assert.False(result);
    }

    [Fact]
    public async Task VerifyOtpAsync_ValidToken_ReturnsTrue()
    {
        var user = BuildUser();
        var token = new PasswordResetToken { UserId = user.Id.ToString(), OtpCode = "123456", ExpiresAt = DateTime.UtcNow.AddMinutes(10) };
        _userRepository
            .Setup(r => r.GetByEmailAsync(user.Email!, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _passwordResetRepository
            .Setup(r => r.GetValidTokenAsync(user.Id.ToString(), "123456"))
            .ReturnsAsync(token);

        var result = await CreateSut().VerifyOtpAsync(user.Email!, "123456");

        Assert.True(result);
    }

    [Fact]
    public async Task ResetPasswordAsync_UserNotFound_ReturnsFalse()
    {
        _userRepository
            .Setup(r => r.GetByEmailAsync("missing@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        var result = await CreateSut().ResetPasswordAsync("missing@example.com", "123456", "new-password");

        Assert.False(result);
        _userRepository.Verify(r => r.UpdatePasswordAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ResetPasswordAsync_TokenInvalid_ReturnsFalseAndDoesNotUpdatePassword()
    {
        var user = BuildUser();
        _userRepository
            .Setup(r => r.GetByEmailAsync(user.Email!, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _passwordResetRepository
            .Setup(r => r.GetValidTokenAsync(user.Id.ToString(), "999999"))
            .ReturnsAsync((PasswordResetToken?)null);

        var result = await CreateSut().ResetPasswordAsync(user.Email!, "999999", "new-password");

        Assert.False(result);
        _userRepository.Verify(r => r.UpdatePasswordAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ResetPasswordAsync_TokenValidButPasswordUpdateFails_ReturnsFalseAndDoesNotMarkTokenUsed()
    {
        var user = BuildUser();
        var token = new PasswordResetToken { Id = "token-1", UserId = user.Id.ToString(), OtpCode = "123456", ExpiresAt = DateTime.UtcNow.AddMinutes(10) };
        _userRepository
            .Setup(r => r.GetByEmailAsync(user.Email!, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _passwordResetRepository
            .Setup(r => r.GetValidTokenAsync(user.Id.ToString(), "123456"))
            .ReturnsAsync(token);
        _userRepository
            .Setup(r => r.UpdatePasswordAsync(user.UserName, "new-password", It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var result = await CreateSut().ResetPasswordAsync(user.Email!, "123456", "new-password");

        Assert.False(result);
        _passwordResetRepository.Verify(r => r.MarkAsUsedAsync(token.Id), Times.Never);
    }

    [Fact]
    public async Task ResetPasswordAsync_TokenValidAndPasswordUpdateSucceeds_ReturnsTrueAndMarksTokenUsed()
    {
        var user = BuildUser();
        var token = new PasswordResetToken { Id = "token-1", UserId = user.Id.ToString(), OtpCode = "123456", ExpiresAt = DateTime.UtcNow.AddMinutes(10) };
        _userRepository
            .Setup(r => r.GetByEmailAsync(user.Email!, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _passwordResetRepository
            .Setup(r => r.GetValidTokenAsync(user.Id.ToString(), "123456"))
            .ReturnsAsync(token);
        _userRepository
            .Setup(r => r.UpdatePasswordAsync(user.UserName, "new-password", It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var result = await CreateSut().ResetPasswordAsync(user.Email!, "123456", "new-password");

        Assert.True(result);
        _passwordResetRepository.Verify(r => r.MarkAsUsedAsync(token.Id), Times.Once);
    }

    [Fact]
    public async Task SendWelcomeEmailAsync_SendsEmailWithCredentialsToGivenAddress()
    {
        await CreateSut().SendWelcomeEmailAsync("newbarber@example.com", "New Barber", "newbarber", "Temp1234!");

        _emailService.Verify(
            e => e.SendEmailAsync(
                "newbarber@example.com",
                It.Is<string>(s => s.Contains("Bienvenido")),
                It.Is<string>(b => b.Contains("newbarber") && b.Contains("Temp1234!")),
                true),
            Times.Once);
    }

    [Fact]
    public async Task SendWelcomeEmailAsync_EmailSendFails_DoesNotThrow()
    {
        _emailService
            .Setup(e => e.SendEmailAsync("newbarber@example.com", It.IsAny<string>(), It.IsAny<string>(), true))
            .ThrowsAsync(new InvalidOperationException("SMTP unavailable"));

        var exception = await Record.ExceptionAsync(() =>
            CreateSut().SendWelcomeEmailAsync("newbarber@example.com", "New Barber", "newbarber", "Temp1234!"));

        Assert.Null(exception);
    }
}
