using Barber.Flow.Application.Services.Accounts;
using Barber.Flow.Domain.Entities;
using Barber.Flow.Domain.Interfaces;
using Microsoft.Extensions.Configuration;
using Moq;
using BarberEntity = Barber.Flow.Domain.Entities.Barber;

namespace Barber.Flow.Application.Tests.Services.Accounts;

public class AccountDeletionServiceTests
{
    private readonly Mock<IUserRepository> _users = new();
    private readonly Mock<IBarberRepository> _barbers = new();
    private readonly Mock<IBarberShopRepository> _shops = new();
    private readonly Mock<IClientRepository> _clients = new();
    private readonly Mock<IAppointmentRepository> _appointments = new();
    private readonly Mock<IRefreshTokenRepository> _refreshTokens = new();
    private readonly Mock<IPasswordResetRepository> _resetTokens = new();
    private readonly List<string> _calls = [];

    private AccountDeletionService CreateSut()
    {
        // A loose mock answers null for every key, so the admin username falls back to "admin".
        var config = new Mock<IConfiguration>();
        return new AccountDeletionService(
            _users.Object, _barbers.Object, _shops.Object, _clients.Object,
            _appointments.Object, _refreshTokens.Object, _resetTokens.Object, config.Object);
    }

    private static User BuildUser(string userName = "jaden01", string role = "Barber") =>
        new() { Id = Guid.NewGuid(), UserName = userName, Role = role };

    private static BarberEntity BuildBarber(string userName = "jaden01", string shopId = "SHOP-0001") =>
        new() { Id = "CRB-0001", UserName = userName, ShopId = shopId, CreatedBy = "admin" };

    // Records the order of the destructive calls so the "login account goes last" rule is pinned.
    private void TrackCalls()
    {
        _appointments.Setup(r => r.DeleteByCreatorAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Callback<string, CancellationToken>((owner, _) => _calls.Add($"appointments:{owner}")).ReturnsAsync(3);
        _clients.Setup(r => r.DeleteByCreatorAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Callback<string, CancellationToken>((owner, _) => _calls.Add($"clients:{owner}")).ReturnsAsync(2);
        _shops.Setup(r => r.DeleteAsync(It.IsAny<string>(), It.IsAny<string>()))
            .Callback<string, string>((id, _) => _calls.Add($"shop:{id}")).ReturnsAsync(true);
        _barbers.Setup(r => r.DeleteAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Callback<string, CancellationToken>((id, _) => _calls.Add($"barber:{id}")).ReturnsAsync(true);
        _refreshTokens.Setup(r => r.DeleteAllForUserAsync(It.IsAny<string>()))
            .Callback<string>(_ => _calls.Add("refreshTokens")).Returns(Task.CompletedTask);
        _resetTokens.Setup(r => r.DeleteAllForUserAsync(It.IsAny<string>()))
            .Callback<string>(_ => _calls.Add("resetTokens")).Returns(Task.CompletedTask);
        _users.Setup(r => r.DeleteAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Callback<string, CancellationToken>((_, _) => _calls.Add("user")).ReturnsAsync(true);
        _barbers.Setup(r => r.FindAsync(null, null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<BarberEntity>());
    }

    [Fact]
    public async Task DeleteByUserId_DeletesAllOwnedDataAndTheLoginAccountLast()
    {
        var user = BuildUser();
        var barber = BuildBarber();
        _users.Setup(r => r.GetByIdAsync(user.Id, It.IsAny<CancellationToken>())).ReturnsAsync(user);
        _barbers.Setup(r => r.GetByUserNameAsync("jaden01", It.IsAny<CancellationToken>())).ReturnsAsync(barber);
        TrackCalls();

        var result = await CreateSut().DeleteByUserIdAsync(user.Id.ToString());

        Assert.Equal(AccountDeletionOutcome.Deleted, result.Outcome);
        Assert.Equal(2, result.ClientsDeleted);
        Assert.Equal(3, result.AppointmentsDeleted);
        Assert.Contains("appointments:jaden01", _calls);
        Assert.Contains("clients:jaden01", _calls);
        Assert.Contains("shop:SHOP-0001", _calls);
        Assert.Contains("barber:CRB-0001", _calls);
        Assert.Contains("refreshTokens", _calls);
        Assert.Contains("resetTokens", _calls);
        Assert.Equal("user", _calls[^1]);
    }

    [Fact]
    public async Task DeleteByUserId_ShopOwnedByTheCreatingAdmin_IsDeletedUnderThatOwner()
    {
        var user = BuildUser();
        _users.Setup(r => r.GetByIdAsync(user.Id, It.IsAny<CancellationToken>())).ReturnsAsync(user);
        _barbers.Setup(r => r.GetByUserNameAsync("jaden01", It.IsAny<CancellationToken>())).ReturnsAsync(BuildBarber());
        TrackCalls();

        await CreateSut().DeleteByUserIdAsync(user.Id.ToString());

        _shops.Verify(r => r.DeleteAsync("SHOP-0001", "admin"), Times.Once);
    }

    [Fact]
    public async Task DeleteByUserId_ShopSharedWithAnotherBarber_KeepsTheShop()
    {
        var user = BuildUser();
        _users.Setup(r => r.GetByIdAsync(user.Id, It.IsAny<CancellationToken>())).ReturnsAsync(user);
        _barbers.Setup(r => r.GetByUserNameAsync("jaden01", It.IsAny<CancellationToken>())).ReturnsAsync(BuildBarber());
        TrackCalls();
        _barbers.Setup(r => r.FindAsync(null, null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<BarberEntity> { BuildBarber(), new() { Id = "CRB-0002", UserName = "otro", ShopId = "SHOP-0001" } });

        await CreateSut().DeleteByUserIdAsync(user.Id.ToString());

        _shops.Verify(r => r.DeleteAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Never);
        _barbers.Verify(r => r.DeleteAsync("CRB-0001", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteByUserId_BarberRecordSpelledWithOtherCasing_ClearsBothSpellings()
    {
        var user = BuildUser("Jaden01");
        _users.Setup(r => r.GetByIdAsync(user.Id, It.IsAny<CancellationToken>())).ReturnsAsync(user);
        _barbers.Setup(r => r.GetByUserNameAsync("Jaden01", It.IsAny<CancellationToken>())).ReturnsAsync(BuildBarber("jaden01"));
        TrackCalls();

        await CreateSut().DeleteByUserIdAsync(user.Id.ToString());

        Assert.Contains("appointments:Jaden01", _calls);
        Assert.Contains("appointments:jaden01", _calls);
        Assert.Contains("clients:Jaden01", _calls);
        Assert.Contains("clients:jaden01", _calls);
    }

    [Fact]
    public async Task DeleteByUserId_UserWithoutBarberRecord_StillDeletesDataTokensAndAccount()
    {
        var user = BuildUser();
        _users.Setup(r => r.GetByIdAsync(user.Id, It.IsAny<CancellationToken>())).ReturnsAsync(user);
        _barbers.Setup(r => r.GetByUserNameAsync("jaden01", It.IsAny<CancellationToken>())).ReturnsAsync((BarberEntity?)null);
        TrackCalls();

        var result = await CreateSut().DeleteByUserIdAsync(user.Id.ToString());

        Assert.Equal(AccountDeletionOutcome.Deleted, result.Outcome);
        Assert.DoesNotContain(_calls, c => c.StartsWith("barber:") || c.StartsWith("shop:"));
        Assert.Equal("user", _calls[^1]);
    }

    [Fact]
    public async Task DeleteByUserId_AdminAccount_IsForbiddenAndNothingIsDeleted()
    {
        var admin = BuildUser("admin", "Admin");
        _users.Setup(r => r.GetByIdAsync(admin.Id, It.IsAny<CancellationToken>())).ReturnsAsync(admin);
        TrackCalls();

        var result = await CreateSut().DeleteByUserIdAsync(admin.Id.ToString());

        Assert.Equal(AccountDeletionOutcome.Forbidden, result.Outcome);
        Assert.Empty(_calls);
    }

    [Theory]
    [InlineData("not-a-guid")]
    [InlineData("")]
    public async Task DeleteByUserId_InvalidId_IsNotFound(string userId)
    {
        var result = await CreateSut().DeleteByUserIdAsync(userId);

        Assert.Equal(AccountDeletionOutcome.NotFound, result.Outcome);
    }

    [Fact]
    public async Task DeleteByUserId_UnknownUser_IsNotFound()
    {
        _users.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync((User?)null);

        var result = await CreateSut().DeleteByUserIdAsync(Guid.NewGuid().ToString());

        Assert.Equal(AccountDeletionOutcome.NotFound, result.Outcome);
    }

    [Fact]
    public async Task DeleteBarber_RemovesTheBarberItsLoginAndEverythingItOwned()
    {
        var user = BuildUser();
        _barbers.Setup(r => r.GetByIdAsync("CRB-0001", It.IsAny<CancellationToken>())).ReturnsAsync(BuildBarber());
        _users.Setup(r => r.GetByUserNameAsync("jaden01", It.IsAny<CancellationToken>())).ReturnsAsync(user);
        TrackCalls();

        var result = await CreateSut().DeleteBarberAsync("CRB-0001");

        Assert.Equal(AccountDeletionOutcome.Deleted, result.Outcome);
        Assert.Contains("barber:CRB-0001", _calls);
        Assert.Contains("shop:SHOP-0001", _calls);
        Assert.Equal("user", _calls[^1]);
    }

    [Fact]
    public async Task DeleteBarber_WithoutALoginAccount_StillDeletesBarberShopAndData()
    {
        _barbers.Setup(r => r.GetByIdAsync("CRB-0001", It.IsAny<CancellationToken>())).ReturnsAsync(BuildBarber());
        _users.Setup(r => r.GetByUserNameAsync("jaden01", It.IsAny<CancellationToken>())).ReturnsAsync((User?)null);
        TrackCalls();

        var result = await CreateSut().DeleteBarberAsync("CRB-0001");

        Assert.Equal(AccountDeletionOutcome.Deleted, result.Outcome);
        Assert.Contains("barber:CRB-0001", _calls);
        Assert.DoesNotContain("user", _calls);
    }

    [Fact]
    public async Task DeleteBarber_LinkedToTheAdminLogin_OnlyRemovesTheBarberRecord()
    {
        // The admin gets commission settings through a Barber record with the admin's username.
        // Deleting it must not wipe the admin account nor everything the admin created.
        var admin = BuildUser("admin", "Admin");
        _barbers.Setup(r => r.GetByIdAsync("CRB-0009", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new BarberEntity { Id = "CRB-0009", UserName = "admin", ShopId = "SHOP-0009", CreatedBy = "admin" });
        _users.Setup(r => r.GetByUserNameAsync("admin", It.IsAny<CancellationToken>())).ReturnsAsync(admin);
        TrackCalls();

        var result = await CreateSut().DeleteBarberAsync("CRB-0009");

        Assert.Equal(AccountDeletionOutcome.Deleted, result.Outcome);
        Assert.Equal(["barber:CRB-0009"], _calls);
    }

    [Fact]
    public async Task DeleteBarber_UnknownBarber_IsNotFound()
    {
        _barbers.Setup(r => r.GetByIdAsync("CRB-0404", It.IsAny<CancellationToken>())).ReturnsAsync((BarberEntity?)null);

        var result = await CreateSut().DeleteBarberAsync("CRB-0404");

        Assert.Equal(AccountDeletionOutcome.NotFound, result.Outcome);
    }
}
