using Barber.Flow.Infrastructure.Services.MongoDb;
using AppointmentEntity = Barber.Flow.Domain.Entities.Appointments;

namespace Barber.Flow.Infrastructure.Tests.MongoDb;

[Collection(MongoDbCollection.Name)]
public class MongoDbAppointmentRepositoryTests
{
    private readonly MongoDbFixture _fixture;

    public MongoDbAppointmentRepositoryTests(MongoDbFixture fixture) => _fixture = fixture;

    private MongoDbAppointmentRepository CreateSut() => new(_fixture.CreateDatabase());

    private static AppointmentEntity BuildAppointment(
        string clientName = "Juan",
        string date = "2026-01-15",
        string time = "10:00",
        string createdBy = "admin",
        string? shopId = null) => new()
    {
        ClientName = clientName,
        Phone = "8888-0000",
        Date = date,
        Time = time,
        CreatedBy = createdBy,
        UpdatedBy = createdBy,
        ShopId = shopId,
    };

    [Fact]
    public async Task CreateAsync_WithoutId_GeneratesSequentialIdWithAptPrefix()
    {
        var sut = CreateSut();

        var first = await sut.CreateAsync(BuildAppointment());
        var second = await sut.CreateAsync(BuildAppointment());

        Assert.StartsWith("APT-", first.Id);
        Assert.NotEqual(first.Id, second.Id);
    }

    [Fact]
    public async Task GetNextIdAsync_PeekDoesNotAdvanceCounter_CreateUsesSameId()
    {
        var sut = CreateSut();

        var peeked = await sut.GetNextIdAsync();
        var created = await sut.CreateAsync(BuildAppointment());

        Assert.Equal(peeked, created.Id);
    }

    [Fact]
    public async Task UpdateAsync_AppointmentNotFound_ReturnsNull()
    {
        var sut = CreateSut();

        var result = await sut.UpdateAsync("APT-9999", BuildAppointment());

        Assert.Null(result);
    }

    [Fact]
    public async Task MoveAsync_ExistingAppointment_ChangesDateOnly()
    {
        var sut = CreateSut();
        var appointment = await sut.CreateAsync(BuildAppointment(date: "2026-01-15", time: "10:00"));

        var moved = await sut.MoveAsync(appointment.Id, "2026-02-01");

        Assert.NotNull(moved);
        Assert.Equal("2026-02-01", moved!.Date);
        Assert.Equal("10:00", moved.Time);
    }

    [Fact]
    public async Task MoveAsync_WithNewTime_ChangesDateAndTime()
    {
        var sut = CreateSut();
        var appointment = await sut.CreateAsync(BuildAppointment(date: "2026-01-15", time: "10:00"));

        var moved = await sut.MoveAsync(appointment.Id, "2026-02-01", "14:30");

        Assert.NotNull(moved);
        Assert.Equal("2026-02-01", moved!.Date);
        Assert.Equal("14:30", moved.Time);
    }

    [Fact]
    public async Task MoveAsync_AppointmentNotFound_ReturnsNull()
    {
        var sut = CreateSut();

        var result = await sut.MoveAsync("APT-9999", "2026-02-01");

        Assert.Null(result);
    }

    [Fact]
    public async Task HasConflictAsync_SameDateAndTimeNotCancelled_ReturnsTrue()
    {
        var sut = CreateSut();
        await sut.CreateAsync(BuildAppointment(date: "2026-03-15", time: "10:00"));

        var result = await sut.HasConflictAsync("admin", "2026-03-15", "10:00", null);

        Assert.True(result);
    }

    [Fact]
    public async Task HasConflictAsync_CancelledAppointmentAtSameSlot_ReturnsFalse()
    {
        var sut = CreateSut();
        var created = await sut.CreateAsync(BuildAppointment(date: "2026-03-16", time: "10:00"));
        created.Status = "cancelled";
        await sut.UpdateAsync(created.Id, created);

        var result = await sut.HasConflictAsync("admin", "2026-03-16", "10:00", null);

        Assert.False(result);
    }

    [Fact]
    public async Task HasConflictAsync_ExcludingSameAppointmentId_ReturnsFalse()
    {
        var sut = CreateSut();
        var created = await sut.CreateAsync(BuildAppointment(date: "2026-03-17", time: "10:00"));

        var result = await sut.HasConflictAsync("admin", "2026-03-17", "10:00", created.Id);

        Assert.False(result);
    }

    [Fact]
    public async Task DeleteAsync_AppointmentNotFound_ReturnsFalse()
    {
        var sut = CreateSut();

        var deleted = await sut.DeleteAsync("APT-9999");

        Assert.False(deleted);
    }

    [Fact]
    public async Task FindAsync_DateRange_ReturnsOnlyAppointmentsInsideRange()
    {
        var sut = CreateSut();
        await sut.CreateAsync(BuildAppointment(date: "2026-01-10"));
        await sut.CreateAsync(BuildAppointment(date: "2026-01-20"));
        await sut.CreateAsync(BuildAppointment(date: "2026-02-05"));

        var result = await sut.FindAsync(date: "2026-01-01", endDate: "2026-01-31");

        Assert.Equal(2, result.Count());
        Assert.All(result, a => Assert.StartsWith("2026-01", a.Date));
    }

    [Fact]
    public async Task FindAsync_ByStatus_ReturnsOnlyMatchingStatus()
    {
        var sut = CreateSut();
        var scheduled = await sut.CreateAsync(BuildAppointment());
        var completed = await sut.CreateAsync(BuildAppointment());
        await sut.UpdateAsync(completed.Id, new AppointmentEntity
        {
            ClientName = completed.ClientName,
            Phone = completed.Phone,
            Date = completed.Date,
            Time = completed.Time,
            Status = "completed",
        });

        var result = await sut.FindAsync(status: "completed");

        Assert.Single(result);
        Assert.Equal(completed.Id, result.First().Id);
        Assert.NotEqual(scheduled.Id, result.First().Id);
    }

    [Fact]
    public async Task FindAsync_ByShopId_ReturnsOnlyMatchingShop()
    {
        var sut = CreateSut();
        await sut.CreateAsync(BuildAppointment(clientName: "Owned By A", shopId: "SHOP-A"));
        await sut.CreateAsync(BuildAppointment(clientName: "Owned By B", shopId: "SHOP-B"));

        var result = await sut.FindAsync(shopId: "SHOP-A");

        Assert.Single(result);
        Assert.Equal("Owned By A", result.First().ClientName);
    }

    [Fact]
    public async Task FindAsync_WithPageZero_DoesNotThrowAndReturnsFirstPage()
    {
        var sut = CreateSut();
        await sut.CreateAsync(BuildAppointment());

        var result = await sut.FindAsync(page: 0, pageSize: 10);

        Assert.Single(result);
    }

    [Fact]
    public async Task GetClientHistoryAsync_FiltersByClientIdAndCreatedBy_SortedNewestFirst()
    {
        var sut = CreateSut();
        var clientId = Guid.NewGuid().ToString();
        var older = await sut.CreateAsync(new AppointmentEntity
        {
            ClientName = "Juan",
            Phone = "8888-0000",
            ClientId = clientId,
            Date = "2026-01-01",
            Time = "09:00",
            CreatedBy = "admin",
        });
        var newer = await sut.CreateAsync(new AppointmentEntity
        {
            ClientName = "Juan",
            Phone = "8888-0000",
            ClientId = clientId,
            Date = "2026-01-10",
            Time = "09:00",
            CreatedBy = "admin",
        });
        await sut.CreateAsync(new AppointmentEntity
        {
            ClientName = "Otro Cliente",
            Phone = "8888-1111",
            ClientId = Guid.NewGuid().ToString(),
            Date = "2026-01-05",
            Time = "09:00",
            CreatedBy = "admin",
        });

        var history = (await sut.GetClientHistoryAsync(clientId, "admin")).ToList();

        Assert.Equal(2, history.Count);
        Assert.Equal(newer.Id, history[0].Id);
        Assert.Equal(older.Id, history[1].Id);
    }

    [Fact]
    public async Task FindByPhoneAsync_MatchesPhoneAndCreatedBy_ReturnsMostRecentlyCreated()
    {
        var sut = CreateSut();
        await sut.CreateAsync(new AppointmentEntity { ClientName = "Juan", Phone = "8888-9999", Date = "2026-01-01", Time = "09:00", CreatedBy = "admin" });
        var latest = await sut.CreateAsync(new AppointmentEntity { ClientName = "Juan", Phone = "8888-9999", Date = "2026-01-10", Time = "09:00", CreatedBy = "admin" });

        var result = await sut.FindByPhoneAsync("8888-9999", "admin");

        Assert.NotNull(result);
        Assert.Equal(latest.Id, result!.Id);
    }

    [Fact]
    public async Task FindByPhoneAsync_NoMatch_ReturnsNull()
    {
        var sut = CreateSut();

        var result = await sut.FindByPhoneAsync("0000-0000", "admin");

        Assert.Null(result);
    }

    // ---- adjustable durations (AGENDA_DURATION_PLAN.md) ----------------------------------------

    private static AppointmentEntity WithDuration(AppointmentEntity appointment, int? duration)
    {
        appointment.DurationMinutes = duration;
        return appointment;
    }

    [Fact]
    public async Task HasConflictAsync_SameSlotButDifferentOwner_ReturnsFalse()
    {
        var sut = CreateSut();
        await sut.CreateAsync(BuildAppointment(date: "2032-02-1", time: "10:00", createdBy: "barber-a"));

        Assert.False(await sut.HasConflictAsync("barber-b", "2032-02-1", "10:00", null));
        Assert.True(await sut.HasConflictAsync("barber-a", "2032-02-1", "10:00", null));
    }

    [Fact]
    public async Task HasOverlapAsync_30MinuteAppointmentBlocksTheNext15MinuteSpot_ButNotTheNextHalfHour()
    {
        var sut = CreateSut();
        await sut.CreateAsync(WithDuration(BuildAppointment(date: "2032-02-2", time: "11:00"), 30));

        Assert.True(await sut.HasOverlapAsync("admin", "2032-02-2", 11 * 60 + 15, 15, null));
        Assert.True(await sut.HasOverlapAsync("admin", "2032-02-2", 10 * 60 + 45, 30, null));
        Assert.False(await sut.HasOverlapAsync("admin", "2032-02-2", 11 * 60 + 30, 30, null));
        Assert.False(await sut.HasOverlapAsync("admin", "2032-02-2", 10 * 60 + 30, 30, null));
    }

    [Fact]
    public async Task HasOverlapAsync_ShorteningTo15MinutesFreesTheNextSpot()
    {
        var sut = CreateSut();
        var created = await sut.CreateAsync(WithDuration(BuildAppointment(date: "2032-02-3", time: "11:00"), 30));
        Assert.True(await sut.HasOverlapAsync("admin", "2032-02-3", 11 * 60 + 15, 15, null));

        await sut.ResizeAsync(created.Id, 15);

        Assert.False(await sut.HasOverlapAsync("admin", "2032-02-3", 11 * 60 + 15, 15, null));
    }

    [Fact]
    public async Task HasOverlapAsync_AppointmentWithoutStoredDuration_CountsAs30Minutes()
    {
        var sut = CreateSut();
        await sut.CreateAsync(BuildAppointment(date: "2032-02-4", time: "11:00"));

        Assert.True(await sut.HasOverlapAsync("admin", "2032-02-4", 11 * 60 + 15, 15, null));
        Assert.False(await sut.HasOverlapAsync("admin", "2032-02-4", 11 * 60 + 30, 15, null));
    }

    [Fact]
    public async Task HasOverlapAsync_IgnoresCancelledOtherOwnersExcludedIdAndOtherDays()
    {
        var sut = CreateSut();
        var mine = await sut.CreateAsync(BuildAppointment(date: "2032-02-5", time: "11:00"));
        var cancelled = await sut.CreateAsync(BuildAppointment(date: "2032-02-5", time: "12:00"));
        cancelled.Status = "cancelled";
        await sut.UpdateAsync(cancelled.Id, cancelled);
        await sut.CreateAsync(BuildAppointment(date: "2032-02-5", time: "13:00", createdBy: "barber-b"));
        await sut.CreateAsync(BuildAppointment(date: "2032-02-5B", time: "14:00"));

        Assert.False(await sut.HasOverlapAsync("admin", "2032-02-5", 11 * 60, 30, mine.Id));
        Assert.False(await sut.HasOverlapAsync("admin", "2032-02-5", 12 * 60, 30, null));
        Assert.False(await sut.HasOverlapAsync("admin", "2032-02-5", 13 * 60, 30, null));
        Assert.False(await sut.HasOverlapAsync("admin", "2032-02-5", 14 * 60, 30, null));
    }

    [Fact]
    public async Task ResizeAsync_SetsDurationAndOptionallyTheStartTime()
    {
        var sut = CreateSut();
        var created = await sut.CreateAsync(WithDuration(BuildAppointment(date: "2032-02-6", time: "11:00"), 30));

        var shortened = await sut.ResizeAsync(created.Id, 15);

        Assert.Equal(15, shortened!.DurationMinutes);
        Assert.Equal("11:00", shortened.Time);

        var movedStart = await sut.ResizeAsync(created.Id, 15, "11:15");
        Assert.Equal("11:15", movedStart!.Time);
        Assert.Equal(15, (await sut.GetByIdAsync(created.Id))!.DurationMinutes);
        Assert.Null(await sut.ResizeAsync("APT-9999", 15));
    }

    [Fact]
    public async Task UpdateAsync_PersistsDurationMinutes()
    {
        var sut = CreateSut();
        var created = await sut.CreateAsync(BuildAppointment(date: "2032-02-7", time: "11:00"));
        created.DurationMinutes = 45;

        var updated = await sut.UpdateAsync(created.Id, created);

        Assert.Equal(45, updated!.DurationMinutes);
        Assert.Equal(45, (await sut.GetByIdAsync(created.Id))!.DurationMinutes);
    }
}
