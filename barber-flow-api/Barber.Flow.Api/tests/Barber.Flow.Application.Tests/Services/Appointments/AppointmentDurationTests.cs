using Barber.Flow.Application.Services.Appointments;
using Barber.Flow.Domain.Entities;
using Barber.Flow.Domain.Interfaces;
using Barber.Flow.Domain.ValueObjects;
using Moq;
using BarberEntity = Barber.Flow.Domain.Entities.Barber;

namespace Barber.Flow.Application.Tests.Services.AppointmentsFeature;

/// <summary>Adjustable appointment durations (AGENDA_DURATION_PLAN.md): overlap rule, resize and the per-barber flag.</summary>
public class AppointmentDurationTests
{
    private const string Owner = "barber1";
    private const string Date = "2031-05-06";

    private readonly Mock<IAppointmentRepository> _repo = new();
    private readonly Mock<IBarberRepository> _barberRepo = new();

    private AppointmentService CreateSut() => new(_repo.Object, _barberRepo.Object);

    private void SetupBarber(bool? durationsEnabled)
    {
        var barber = new BarberEntity
        {
            UserName = Owner,
            ShopId = "SHOP-0001",
            Settings = new BarberSettings(40m, 0m, null, durationsEnabled),
        };
        _barberRepo.Setup(b => b.GetByUserNameAsync(Owner, It.IsAny<CancellationToken>())).ReturnsAsync(barber);
        _repo.Setup(r => r.CreateAsync(It.IsAny<Barber.Flow.Domain.Entities.Appointments>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Barber.Flow.Domain.Entities.Appointments a, CancellationToken _) => a);
        _repo.Setup(r => r.UpdateAsync(It.IsAny<string>(), It.IsAny<Barber.Flow.Domain.Entities.Appointments>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((string _, Barber.Flow.Domain.Entities.Appointments a, CancellationToken _) => a);
    }

    private static Barber.Flow.Domain.Entities.Appointments Appointment(string time = "11:00", int? duration = null) => new()
    {
        Id = "APT-0001", ClientName = "Juan", Phone = "8888-0000", Date = Date, Time = time,
        DurationMinutes = duration, CreatedBy = Owner, UpdatedBy = Owner,
    };

    private void SetupExisting(Barber.Flow.Domain.Entities.Appointments existing) =>
        _repo.Setup(r => r.GetByIdAsync(existing.Id, It.IsAny<CancellationToken>())).ReturnsAsync(existing);

    private void SetupOverlap(bool overlaps) =>
        _repo.Setup(r => r.HasOverlapAsync(It.IsAny<string?>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(overlaps);

    // ---- create ---------------------------------------------------------------------------------

    [Fact]
    public async Task Create_FeatureOn_DefaultsTo30MinutesAndUsesOverlapRuleForTheOwner()
    {
        SetupBarber(true);
        SetupOverlap(false);

        var created = await CreateSut().CreateAsync(Appointment("11:00"));

        Assert.Equal(30, created.DurationMinutes);
        _repo.Verify(r => r.HasOverlapAsync(Owner, Date, 11 * 60, 30, null, It.IsAny<CancellationToken>()), Times.Once);
        _repo.Verify(r => r.HasConflictAsync(It.IsAny<string?>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Create_FeatureOn_15MinuteAppointmentChecksOnly15Minutes()
    {
        SetupBarber(true);
        SetupOverlap(false);

        var created = await CreateSut().CreateAsync(Appointment("11:15", duration: 15));

        Assert.Equal(15, created.DurationMinutes);
        _repo.Verify(r => r.HasOverlapAsync(Owner, Date, 11 * 60 + 15, 15, null, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Create_FeatureOn_Overlap_ThrowsSlotTakenWithTheRange()
    {
        SetupBarber(true);
        SetupOverlap(true);

        var ex = await Assert.ThrowsAsync<AppointmentSchedulingException>(() => CreateSut().CreateAsync(Appointment("11:15")));

        Assert.Equal(AppointmentSchedulingException.SlotTakenCode, ex.Code);
        Assert.Contains("11:15", ex.Message);
        Assert.Contains("11:45", ex.Message);
        _repo.Verify(r => r.CreateAsync(It.IsAny<Barber.Flow.Domain.Entities.Appointments>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Theory]
    [InlineData(10)]
    [InlineData(20)]
    [InlineData(135)]
    [InlineData(0)]
    public async Task Create_FeatureOn_InvalidDuration_Throws(int duration)
    {
        SetupBarber(true);

        var ex = await Assert.ThrowsAsync<AppointmentSchedulingException>(() => CreateSut().CreateAsync(Appointment(duration: duration)));

        Assert.Equal(AppointmentSchedulingException.InvalidDurationCode, ex.Code);
    }

    [Fact]
    public async Task Create_FeatureOff_IgnoresTheDurationAndKeepsTheExactTimeRule()
    {
        SetupBarber(false);
        _repo.Setup(r => r.HasConflictAsync(Owner, Date, "11:00", null, It.IsAny<CancellationToken>())).ReturnsAsync(false);

        var created = await CreateSut().CreateAsync(Appointment("11:00", duration: 15));

        Assert.Null(created.DurationMinutes);
        _repo.Verify(r => r.HasConflictAsync(Owner, Date, "11:00", null, It.IsAny<CancellationToken>()), Times.Once);
        _repo.Verify(r => r.HasOverlapAsync(It.IsAny<string?>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Create_FeatureOff_ExactTimeConflictStillThrows()
    {
        SetupBarber(null);
        _repo.Setup(r => r.HasConflictAsync(Owner, Date, "11:00", null, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var ex = await Assert.ThrowsAsync<AppointmentSchedulingException>(() => CreateSut().CreateAsync(Appointment("11:00")));

        Assert.Equal(AppointmentSchedulingException.SlotTakenCode, ex.Code);
    }

    // ---- update ---------------------------------------------------------------------------------

    [Fact]
    public async Task Update_RequestWithoutDuration_KeepsTheStoredOneAndDoesNotRecheck()
    {
        SetupBarber(true);
        SetupExisting(Appointment("11:00", duration: 15));
        var incoming = Appointment("11:00");
        incoming.Notes = "only a note changed";

        var updated = await CreateSut().UpdateAsync("APT-0001", incoming);

        Assert.Equal(15, updated!.DurationMinutes);
        _repo.Verify(r => r.HasOverlapAsync(It.IsAny<string?>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Update_DurationChanged_RechecksExcludingItselfAndRejectsOverlap()
    {
        SetupBarber(true);
        SetupExisting(Appointment("11:00", duration: 15));
        _repo.Setup(r => r.HasOverlapAsync(Owner, Date, 11 * 60, 30, "APT-0001", It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var ex = await Assert.ThrowsAsync<AppointmentSchedulingException>(
            () => CreateSut().UpdateAsync("APT-0001", Appointment("11:00", duration: 30)));

        Assert.Equal(AppointmentSchedulingException.SlotTakenCode, ex.Code);
    }

    [Fact]
    public async Task Update_FeatureOff_KeepsTheStoredDurationEvenIfTheRequestSendsOne()
    {
        SetupBarber(false);
        SetupExisting(Appointment("11:00", duration: 15));

        var updated = await CreateSut().UpdateAsync("APT-0001", Appointment("11:00", duration: 60));

        Assert.Equal(15, updated!.DurationMinutes);
    }

    // ---- move -----------------------------------------------------------------------------------

    [Fact]
    public async Task Move_FeatureOn_UsesTheStoredDuration()
    {
        SetupBarber(true);
        SetupExisting(Appointment("11:00", duration: 15));
        SetupOverlap(false);
        _repo.Setup(r => r.MoveAsync("APT-0001", Date, "12:15", It.IsAny<CancellationToken>())).ReturnsAsync(Appointment("12:15", 15));

        await CreateSut().MoveAsync("APT-0001", Date, "12:15");

        _repo.Verify(r => r.HasOverlapAsync(Owner, Date, 12 * 60 + 15, 15, "APT-0001", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Move_LegacyAppointmentWithoutDuration_CountsAs30Minutes()
    {
        SetupBarber(true);
        SetupExisting(Appointment("11:00", duration: null));
        SetupOverlap(false);
        _repo.Setup(r => r.MoveAsync("APT-0001", Date, "12:00", It.IsAny<CancellationToken>())).ReturnsAsync(Appointment("12:00"));

        await CreateSut().MoveAsync("APT-0001", Date, "12:00");

        _repo.Verify(r => r.HasOverlapAsync(Owner, Date, 12 * 60, 30, "APT-0001", It.IsAny<CancellationToken>()), Times.Once);
    }

    // ---- resize ---------------------------------------------------------------------------------

    [Fact]
    public async Task Resize_FeatureOn_ShortensTheAppointmentWithoutChangingItsStart()
    {
        SetupBarber(true);
        SetupExisting(Appointment("11:00", duration: 30));
        SetupOverlap(false);
        _repo.Setup(r => r.ResizeAsync("APT-0001", 15, null, It.IsAny<CancellationToken>())).ReturnsAsync(Appointment("11:00", 15));

        var result = await CreateSut().ResizeAsync("APT-0001", 15);

        Assert.Equal(15, result!.DurationMinutes);
        _repo.Verify(r => r.HasOverlapAsync(Owner, Date, 11 * 60, 15, "APT-0001", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Resize_WithNewTime_ChecksTheNewRangeAndMovesTheStart()
    {
        SetupBarber(true);
        SetupExisting(Appointment("11:00", duration: 30));
        SetupOverlap(false);
        _repo.Setup(r => r.ResizeAsync("APT-0001", 15, "11:15", It.IsAny<CancellationToken>())).ReturnsAsync(Appointment("11:15", 15));

        var result = await CreateSut().ResizeAsync("APT-0001", 15, "11:15");

        Assert.Equal("11:15", result!.Time);
        _repo.Verify(r => r.HasOverlapAsync(Owner, Date, 11 * 60 + 15, 15, "APT-0001", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Resize_Overlap_ThrowsSlotTakenAndDoesNotPersist()
    {
        SetupBarber(true);
        SetupExisting(Appointment("11:00", duration: 15));
        SetupOverlap(true);

        var ex = await Assert.ThrowsAsync<AppointmentSchedulingException>(() => CreateSut().ResizeAsync("APT-0001", 30));

        Assert.Equal(AppointmentSchedulingException.SlotTakenCode, ex.Code);
        _repo.Verify(r => r.ResizeAsync(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Resize_FeatureOff_ThrowsFeatureDisabled()
    {
        SetupBarber(false);
        SetupExisting(Appointment("11:00"));

        var ex = await Assert.ThrowsAsync<AppointmentSchedulingException>(() => CreateSut().ResizeAsync("APT-0001", 15));

        Assert.Equal(AppointmentSchedulingException.FeatureDisabledCode, ex.Code);
    }

    [Theory]
    [InlineData(20)]
    [InlineData(200)]
    public async Task Resize_InvalidDuration_Throws(int duration)
    {
        SetupBarber(true);
        SetupExisting(Appointment("11:00"));

        var ex = await Assert.ThrowsAsync<AppointmentSchedulingException>(() => CreateSut().ResizeAsync("APT-0001", duration));

        Assert.Equal(AppointmentSchedulingException.InvalidDurationCode, ex.Code);
    }

    [Fact]
    public async Task Resize_RunningPastMidnight_Throws()
    {
        SetupBarber(true);
        SetupExisting(Appointment("23:45", duration: 15));

        var ex = await Assert.ThrowsAsync<AppointmentSchedulingException>(() => CreateSut().ResizeAsync("APT-0001", 30));

        Assert.Equal(AppointmentSchedulingException.InvalidDurationCode, ex.Code);
    }

    [Fact]
    public async Task Resize_AppointmentNotFound_ReturnsNull()
    {
        _repo.Setup(r => r.GetByIdAsync("missing", It.IsAny<CancellationToken>())).ReturnsAsync((Barber.Flow.Domain.Entities.Appointments?)null);

        Assert.Null(await CreateSut().ResizeAsync("missing", 15));
    }

    // ---- recurring ------------------------------------------------------------------------------

    [Fact]
    public async Task CreateRecurring_FeatureOn_EveryOccurrenceKeepsTheDuration()
    {
        var barber = new BarberEntity
        {
            UserName = Owner,
            Settings = new BarberSettings(40m, 0m, 3, true),
        };
        _barberRepo.Setup(b => b.GetByUserNameAsync(Owner, It.IsAny<CancellationToken>())).ReturnsAsync(barber);
        _repo.Setup(r => r.CreateAsync(It.IsAny<Barber.Flow.Domain.Entities.Appointments>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Barber.Flow.Domain.Entities.Appointments a, CancellationToken _) => a);
        SetupOverlap(false);

        var result = await CreateSut().CreateRecurringAsync(Appointment("11:00", duration: 15), RecurrenceFrequency.Weekly);

        Assert.Equal(3, result.Created.Count);
        Assert.All(result.Created, a => Assert.Equal(15, a.DurationMinutes));
    }
}

public class AppointmentScheduleTests
{
    [Theory]
    [InlineData("11:00", 30, "11:00", 30, true)]   // same range
    [InlineData("11:00", 30, "11:15", 15, true)]   // a 30-min appointment blocks the next 15-min spot
    [InlineData("11:00", 30, "11:30", 30, false)]  // end is exclusive: back to back is fine
    [InlineData("11:00", 15, "11:15", 15, false)]  // shortened to 15 frees the next spot
    [InlineData("11:15", 15, "11:00", 30, true)]   // a new 30-min appointment cannot swallow the 15-min one
    [InlineData("11:10", 30, "11:30", 30, true)]   // free-form start times still overlap by range
    public void Overlaps_UsesHalfOpenRanges(string existingTime, int existingDuration, string newTime, int newDuration, bool expected)
    {
        AppointmentSchedule.TryParseMinutes(newTime, out var newStart);

        Assert.Equal(expected, AppointmentSchedule.Overlaps(existingTime, existingDuration, newStart, newDuration));
    }

    [Fact]
    public void Overlaps_StoredAppointmentWithoutDuration_CountsAs30Minutes()
    {
        AppointmentSchedule.TryParseMinutes("11:15", out var newStart);

        Assert.True(AppointmentSchedule.Overlaps("11:00", null, newStart, 15));
    }

    [Theory]
    [InlineData("25:00")]
    [InlineData("11:60")]
    [InlineData("abc")]
    [InlineData("")]
    [InlineData(null)]
    public void TryParseMinutes_InvalidTime_ReturnsFalse(string? time) =>
        Assert.False(AppointmentSchedule.TryParseMinutes(time, out _));

    [Theory]
    [InlineData(15, true)]
    [InlineData(30, true)]
    [InlineData(120, true)]
    [InlineData(14, false)]
    [InlineData(45, true)]
    [InlineData(135, false)]
    [InlineData(0, false)]
    public void IsValidDuration_AcceptsMultiplesOf15Between15And120(int minutes, bool expected) =>
        Assert.Equal(expected, AppointmentSchedule.IsValidDuration(minutes));
}
