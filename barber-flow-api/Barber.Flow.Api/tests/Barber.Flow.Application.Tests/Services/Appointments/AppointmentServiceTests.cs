using Barber.Flow.Application.Services.Appointments;
using Barber.Flow.Domain.Entities;
using Barber.Flow.Domain.Interfaces;
using Moq;
using BarberEntity = Barber.Flow.Domain.Entities.Barber;

namespace Barber.Flow.Application.Tests.Services.AppointmentsFeature;

public class AppointmentServiceTests
{
    private readonly Mock<IAppointmentRepository> _repo = new();
    private readonly Mock<IBarberRepository> _barberRepo = new();

    private AppointmentService CreateSut() => new(_repo.Object, _barberRepo.Object);

    [Fact]
    public async Task CreateAsync_WithoutCreatedBy_DelegatesToRepositoryWithoutResolvingShop()
    {
        var appointment = new Appointments { ClientName = "Juan" };
        var created = new Appointments { Id = "APT-0001", ClientName = "Juan" };
        _repo.Setup(r => r.CreateAsync(appointment, It.IsAny<CancellationToken>())).ReturnsAsync(created);

        var result = await CreateSut().CreateAsync(appointment);

        Assert.Same(created, result);
        _barberRepo.Verify(b => b.GetByUserNameAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_WithCreatedBy_ResolvesShopIdFromCreatingBarber()
    {
        var appointment = new Appointments { ClientName = "Juan", CreatedBy = "barber1" };
        var barber = new BarberEntity { UserName = "barber1", ShopId = "SHOP-0001" };
        _barberRepo.Setup(b => b.GetByUserNameAsync("barber1", It.IsAny<CancellationToken>())).ReturnsAsync(barber);
        _repo.Setup(r => r.CreateAsync(It.IsAny<Appointments>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Appointments a, CancellationToken _) => a);

        var result = await CreateSut().CreateAsync(appointment);

        Assert.Equal("SHOP-0001", result.ShopId);
    }

    [Fact]
    public async Task CreateAsync_CreatingBarberHasNoShop_LeavesShopIdNull()
    {
        var appointment = new Appointments { ClientName = "Juan", CreatedBy = "barber1" };
        _barberRepo.Setup(b => b.GetByUserNameAsync("barber1", It.IsAny<CancellationToken>())).ReturnsAsync((BarberEntity?)null);
        _repo.Setup(r => r.CreateAsync(It.IsAny<Appointments>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Appointments a, CancellationToken _) => a);

        var result = await CreateSut().CreateAsync(appointment);

        Assert.Null(result.ShopId);
    }

    [Fact]
    public async Task CreateAsync_ExplicitShopIdAlreadySet_DoesNotOverrideIt()
    {
        var appointment = new Appointments { ClientName = "Juan", CreatedBy = "barber1", ShopId = "SHOP-0002" };
        // The barber is looked up now (to read the durations flag) but must never override an explicit ShopId.
        _barberRepo.Setup(b => b.GetByUserNameAsync("barber1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Barber.Flow.Domain.Entities.Barber { UserName = "barber1", ShopId = "SHOP-OTHER" });
        _repo.Setup(r => r.CreateAsync(It.IsAny<Appointments>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Appointments a, CancellationToken _) => a);

        var result = await CreateSut().CreateAsync(appointment);

        Assert.Equal("SHOP-0002", result.ShopId);
    }

    [Fact]
    public async Task UpdateAsync_AppointmentNotFound_ReturnsNull()
    {
        var appointment = new Appointments { ClientName = "Juan" };
        _repo.Setup(r => r.GetByIdAsync("missing-id", It.IsAny<CancellationToken>())).ReturnsAsync((Appointments?)null);

        var result = await CreateSut().UpdateAsync("missing-id", appointment);

        Assert.Null(result);
        _repo.Verify(r => r.UpdateAsync(It.IsAny<string>(), It.IsAny<Appointments>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task UpdateAsync_PreservesShopIdFromExistingAppointment()
    {
        var appointment = new Appointments { ClientName = "Juan Updated", UpdatedBy = "admin" };
        var existing = new Appointments { Id = "APT-0001", ShopId = "SHOP-0001" };
        var updated = new Appointments { Id = "APT-0001", ClientName = "Juan Updated", ShopId = "SHOP-0001" };
        _repo.Setup(r => r.GetByIdAsync("APT-0001", It.IsAny<CancellationToken>())).ReturnsAsync(existing);
        _repo.Setup(r => r.UpdateAsync("APT-0001", It.Is<Appointments>(a => a.ShopId == "SHOP-0001"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(updated);

        var result = await CreateSut().UpdateAsync("APT-0001", appointment);

        Assert.Same(updated, result);
    }

    [Fact]
    public async Task DeleteAsync_DelegatesToRepositoryAndReturnsItsResult()
    {
        _repo.Setup(r => r.DeleteAsync("APT-0001", It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var result = await CreateSut().DeleteAsync("APT-0001");

        Assert.True(result);
    }

    [Fact]
    public async Task GetByIdAsync_DelegatesToRepositoryAndReturnsItsResult()
    {
        var appointment = new Appointments { Id = "APT-0001" };
        _repo.Setup(r => r.GetByIdAsync("APT-0001", It.IsAny<CancellationToken>())).ReturnsAsync(appointment);

        var result = await CreateSut().GetByIdAsync("APT-0001");

        Assert.Same(appointment, result);
    }

    [Fact]
    public async Task FindAsync_PropagatesAllFilterArgumentsToRepository()
    {
        var expected = new List<Appointments> { new() { Id = "APT-0001" } };
        _repo.Setup(r => r.FindAsync("2026-01-01", "2026-01-31", "completed", "Juan", 2, 10, null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        var result = await CreateSut().FindAsync("2026-01-01", "2026-01-31", "completed", "Juan", 2, 10);

        Assert.Same(expected, result);
        _repo.VerifyAll();
    }

    [Fact]
    public async Task MoveAsync_DelegatesToRepositoryAndReturnsItsResult()
    {
        var futureDate = DateTime.Now.AddDays(5).ToString("yyyy-MM-dd");
        var existing = new Appointments { Id = "APT-0001", Date = "2020-01-01", Time = "09:00" };
        var moved = new Appointments { Id = "APT-0001", Date = futureDate };
        _repo.Setup(r => r.GetByIdAsync("APT-0001", It.IsAny<CancellationToken>())).ReturnsAsync(existing);
        _repo.Setup(r => r.HasConflictAsync(It.IsAny<string?>(), futureDate, "09:00", "APT-0001", It.IsAny<CancellationToken>())).ReturnsAsync(false);
        _repo.Setup(r => r.MoveAsync("APT-0001", futureDate, null, It.IsAny<CancellationToken>())).ReturnsAsync(moved);

        var result = await CreateSut().MoveAsync("APT-0001", futureDate);

        Assert.Same(moved, result);
    }

    [Fact]
    public async Task MoveAsync_AppointmentNotFound_ReturnsNull()
    {
        _repo.Setup(r => r.GetByIdAsync("missing-id", It.IsAny<CancellationToken>())).ReturnsAsync((Appointments?)null);

        var result = await CreateSut().MoveAsync("missing-id", "2031-02-01");

        Assert.Null(result);
        _repo.Verify(r => r.MoveAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task MoveAsync_PastDateTime_IsAllowed()
    {
        var existing = new Appointments { Id = "APT-0001", Date = "2020-01-01", Time = "09:00" };
        var moved = new Appointments { Id = "APT-0001", Date = "2020-01-02", Time = "09:00" };
        _repo.Setup(r => r.GetByIdAsync("APT-0001", It.IsAny<CancellationToken>())).ReturnsAsync(existing);
        _repo.Setup(r => r.HasConflictAsync(It.IsAny<string?>(), "2020-01-02", "09:00", "APT-0001", It.IsAny<CancellationToken>())).ReturnsAsync(false);
        _repo.Setup(r => r.MoveAsync("APT-0001", "2020-01-02", "09:00", It.IsAny<CancellationToken>())).ReturnsAsync(moved);

        var result = await CreateSut().MoveAsync("APT-0001", "2020-01-02", "09:00");

        Assert.Same(moved, result);
    }

    [Fact]
    public async Task MoveAsync_ConflictingSlot_ThrowsAppointmentSchedulingException()
    {
        var futureDate = DateTime.Now.AddDays(5).ToString("yyyy-MM-dd");
        var existing = new Appointments { Id = "APT-0001", Date = "2020-01-01", Time = "09:00" };
        _repo.Setup(r => r.GetByIdAsync("APT-0001", It.IsAny<CancellationToken>())).ReturnsAsync(existing);
        _repo.Setup(r => r.HasConflictAsync(It.IsAny<string?>(), futureDate, "10:00", "APT-0001", It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var ex = await Assert.ThrowsAsync<AppointmentSchedulingException>(
            () => CreateSut().MoveAsync("APT-0001", futureDate, "10:00"));

        Assert.Equal(AppointmentSchedulingException.SlotTakenCode, ex.Code);

        _repo.Verify(r => r.MoveAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task MoveAsync_OnlyDateChanges_ValidatesAgainstExistingTime()
    {
        var futureDate = DateTime.Now.AddDays(5).ToString("yyyy-MM-dd");
        var existing = new Appointments { Id = "APT-0001", Date = "2020-01-01", Time = "09:00" };
        var moved = new Appointments { Id = "APT-0001", Date = futureDate, Time = "09:00" };
        _repo.Setup(r => r.GetByIdAsync("APT-0001", It.IsAny<CancellationToken>())).ReturnsAsync(existing);
        _repo.Setup(r => r.HasConflictAsync(It.IsAny<string?>(), futureDate, "09:00", "APT-0001", It.IsAny<CancellationToken>())).ReturnsAsync(false);
        _repo.Setup(r => r.MoveAsync("APT-0001", futureDate, null, It.IsAny<CancellationToken>())).ReturnsAsync(moved);

        var result = await CreateSut().MoveAsync("APT-0001", futureDate);

        Assert.Same(moved, result);
    }

    [Fact]
    public async Task CreateAsync_PastDateTime_IsAllowed()
    {
        var appointment = new Appointments { ClientName = "Juan", Date = "2020-01-01", Time = "09:00" };
        _repo.Setup(r => r.HasConflictAsync(It.IsAny<string?>(), "2020-01-01", "09:00", null, It.IsAny<CancellationToken>())).ReturnsAsync(false);
        _repo.Setup(r => r.CreateAsync(appointment, It.IsAny<CancellationToken>())).ReturnsAsync(appointment);

        var result = await CreateSut().CreateAsync(appointment);

        Assert.Same(appointment, result);
    }

    [Fact]
    public async Task CreateAsync_FarFutureDateTime_IsAllowed()
    {
        var appointment = new Appointments { ClientName = "Juan", Date = "2099-06-15", Time = "10:00" };
        _repo.Setup(r => r.HasConflictAsync(It.IsAny<string?>(), "2099-06-15", "10:00", null, It.IsAny<CancellationToken>())).ReturnsAsync(false);
        _repo.Setup(r => r.CreateAsync(appointment, It.IsAny<CancellationToken>())).ReturnsAsync(appointment);

        var result = await CreateSut().CreateAsync(appointment);

        Assert.Same(appointment, result);
    }

    [Fact]
    public async Task CreateAsync_ConflictingSlot_ThrowsAppointmentSchedulingException()
    {
        var futureDate = DateTime.Now.AddDays(5).ToString("yyyy-MM-dd");
        var appointment = new Appointments { ClientName = "Juan", Date = futureDate, Time = "09:00" };
        _repo.Setup(r => r.HasConflictAsync(It.IsAny<string?>(), futureDate, "09:00", null, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var ex = await Assert.ThrowsAsync<AppointmentSchedulingException>(() => CreateSut().CreateAsync(appointment));

        Assert.Equal(AppointmentSchedulingException.SlotTakenCode, ex.Code);
        _repo.Verify(r => r.CreateAsync(It.IsAny<Appointments>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task UpdateAsync_DateAndTimeUnchanged_DoesNotValidateSchedule()
    {
        var appointment = new Appointments { ClientName = "Juan", Date = "2020-01-01", Time = "09:00", Status = "completed" };
        var existing = new Appointments { Id = "APT-0001", Date = "2020-01-01", Time = "09:00", ShopId = "SHOP-0001" };
        var updated = new Appointments { Id = "APT-0001", Status = "completed", ShopId = "SHOP-0001" };
        _repo.Setup(r => r.GetByIdAsync("APT-0001", It.IsAny<CancellationToken>())).ReturnsAsync(existing);
        _repo.Setup(r => r.UpdateAsync("APT-0001", It.IsAny<Appointments>(), It.IsAny<CancellationToken>())).ReturnsAsync(updated);

        var result = await CreateSut().UpdateAsync("APT-0001", appointment);

        Assert.Same(updated, result);
        _repo.Verify(r => r.HasConflictAsync(It.IsAny<string?>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task UpdateAsync_DateChangedToPast_IsAllowed()
    {
        var appointment = new Appointments { ClientName = "Juan", Date = "2020-01-01", Time = "09:00" };
        var existing = new Appointments { Id = "APT-0001", Date = "2020-01-02", Time = "09:00" };
        var updated = new Appointments { Id = "APT-0001", Date = "2020-01-01", Time = "09:00" };
        _repo.Setup(r => r.GetByIdAsync("APT-0001", It.IsAny<CancellationToken>())).ReturnsAsync(existing);
        _repo.Setup(r => r.HasConflictAsync(It.IsAny<string?>(), "2020-01-01", "09:00", "APT-0001", It.IsAny<CancellationToken>())).ReturnsAsync(false);
        _repo.Setup(r => r.UpdateAsync("APT-0001", It.IsAny<Appointments>(), It.IsAny<CancellationToken>())).ReturnsAsync(updated);

        var result = await CreateSut().UpdateAsync("APT-0001", appointment);

        Assert.Same(updated, result);
    }

    private static Appointments RecurringTemplate() => new()
    {
        ClientName = "Juan", Phone = "8888-0000", Date = "2031-03-04", Time = "10:00",
        Status = "confirmed", ServicePrice = 5000, CreatedBy = "barber1", UpdatedBy = "barber1",
    };

    private void SetupBarberWithMax(int? max)
    {
        var barber = new BarberEntity
        {
            UserName = "barber1",
            ShopId = "SHOP-0001",
            Settings = new Barber.Flow.Domain.ValueObjects.BarberSettings(40m, 0m, max),
        };
        _barberRepo.Setup(b => b.GetByUserNameAsync("barber1", It.IsAny<CancellationToken>())).ReturnsAsync(barber);
        _repo.Setup(r => r.CreateAsync(It.IsAny<Appointments>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Appointments a, CancellationToken _) => a);
    }

    [Theory]
    [InlineData(null)]
    [InlineData(0)]
    public async Task CreateRecurringAsync_SettingUnsetOrZero_ThrowsRecurrenceDisabled(int? max)
    {
        SetupBarberWithMax(max);

        var ex = await Assert.ThrowsAsync<AppointmentSchedulingException>(
            () => CreateSut().CreateRecurringAsync(RecurringTemplate(), RecurrenceFrequency.Weekly));

        Assert.Equal(AppointmentSchedulingException.RecurrenceDisabledCode, ex.Code);
        _repo.Verify(r => r.CreateAsync(It.IsAny<Appointments>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateRecurringAsync_NoLinkedBarber_ThrowsRecurrenceDisabled()
    {
        _barberRepo.Setup(b => b.GetByUserNameAsync("barber1", It.IsAny<CancellationToken>())).ReturnsAsync((BarberEntity?)null);

        var ex = await Assert.ThrowsAsync<AppointmentSchedulingException>(
            () => CreateSut().CreateRecurringAsync(RecurringTemplate(), RecurrenceFrequency.Weekly));

        Assert.Equal(AppointmentSchedulingException.RecurrenceDisabledCode, ex.Code);
    }

    [Fact]
    public async Task CreateRecurringAsync_CreatesSettingCountSharingSeriesId_FirstKeepsStatusRestScheduled()
    {
        SetupBarberWithMax(4);

        var result = await CreateSut().CreateRecurringAsync(RecurringTemplate(), RecurrenceFrequency.Weekly);

        Assert.Equal(4, result.RequestedCount);
        Assert.Equal(4, result.Created.Count);
        Assert.Empty(result.Conflicts);
        Assert.Equal(new[] { "2031-03-04", "2031-03-11", "2031-03-18", "2031-03-25" }, result.Created.Select(a => a.Date));
        Assert.Equal("confirmed", result.Created[0].Status);
        Assert.All(result.Created.Skip(1), a => Assert.Equal("scheduled", a.Status));
        Assert.All(result.Created, a =>
        {
            Assert.Equal(result.SeriesId, a.SeriesId);
            Assert.Equal("10:00", a.Time);
            Assert.Equal("barber1", a.CreatedBy);
            Assert.Equal("SHOP-0001", a.ShopId);
        });
    }

    [Fact]
    public async Task CreateRecurringAsync_SettingAboveHardLimit_IsClampedToTwenty()
    {
        SetupBarberWithMax(50);

        var result = await CreateSut().CreateRecurringAsync(RecurringTemplate(), RecurrenceFrequency.Weekly);

        Assert.Equal(AppointmentService.MaxRecurringAppointmentsLimit, result.RequestedCount);
        Assert.Equal(20, result.Created.Count);
    }

    [Fact]
    public async Task CreateRecurringAsync_SomeSlotsTaken_CreatesFreeOnesAndReportsConflicts()
    {
        SetupBarberWithMax(3);
        _repo.Setup(r => r.HasConflictAsync(It.IsAny<string?>(), "2031-03-11", "10:00", null, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var result = await CreateSut().CreateRecurringAsync(RecurringTemplate(), RecurrenceFrequency.Weekly);

        Assert.Equal(new[] { "2031-03-04", "2031-03-18" }, result.Created.Select(a => a.Date));
        var conflict = Assert.Single(result.Conflicts);
        Assert.Equal(new RecurrenceConflict("2031-03-11", "10:00"), conflict);
    }

    [Fact]
    public async Task CreateRecurringAsync_AllSlotsTaken_ThrowsSlotTaken()
    {
        SetupBarberWithMax(2);
        _repo.Setup(r => r.HasConflictAsync(It.IsAny<string?>(), It.IsAny<string>(), "10:00", null, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var ex = await Assert.ThrowsAsync<AppointmentSchedulingException>(
            () => CreateSut().CreateRecurringAsync(RecurringTemplate(), RecurrenceFrequency.Weekly));

        Assert.Equal(AppointmentSchedulingException.SlotTakenCode, ex.Code);
    }

    [Fact]
    public async Task GetNextIdAsync_DelegatesToRepositoryAndReturnsItsResult()
    {
        _repo.Setup(r => r.GetNextIdAsync(It.IsAny<CancellationToken>())).ReturnsAsync("APT-0042");

        var result = await CreateSut().GetNextIdAsync();

        Assert.Equal("APT-0042", result);
    }
}
