using Barber.Flow.Infrastructure.Services.InMemory;
using AppointmentEntity = Barber.Flow.Domain.Entities.Appointments;

namespace Barber.Flow.Infrastructure.Tests.InMemory;

public class InMemoryAppointmentRepositoryTests
{
    private static AppointmentEntity BuildAppointment(
        string clientName = "Test Client",
        string phone = "9999-0000",
        string date = "2031-01-15",
        string time = "10:00",
        string createdBy = "admin") => new()
    {
        ClientName = clientName,
        Phone = phone,
        Date = date,
        Time = time,
        CreatedBy = createdBy,
        UpdatedBy = createdBy,
    };

    [Fact]
    public async Task CreateAsync_WithoutId_GeneratesIdWithAptPrefix()
    {
        var repo = new InMemoryAppointmentRepository();

        var created = await repo.CreateAsync(BuildAppointment());

        Assert.StartsWith("APT-", created.Id);
    }

    [Fact]
    public async Task GetNextIdAsync_PeekDoesNotAdvanceCounter_CreateUsesSameId()
    {
        var repo = new InMemoryAppointmentRepository();

        var peeked = await repo.GetNextIdAsync();
        var created = await repo.CreateAsync(BuildAppointment());

        Assert.Equal(peeked, created.Id);
    }

    [Fact]
    public async Task UpdateAsync_AppointmentNotFound_ReturnsNull()
    {
        var repo = new InMemoryAppointmentRepository();

        var result = await repo.UpdateAsync("missing-id", BuildAppointment());

        Assert.Null(result);
    }

    [Fact]
    public async Task MoveAsync_ExistingAppointment_ChangesDateOnly()
    {
        var repo = new InMemoryAppointmentRepository();
        var created = await repo.CreateAsync(BuildAppointment(date: "2031-01-15", time: "10:00"));

        var moved = await repo.MoveAsync(created.Id, "2031-02-01");

        Assert.NotNull(moved);
        Assert.Equal("2031-02-01", moved!.Date);
        Assert.Equal("10:00", moved.Time);
    }

    [Fact]
    public async Task MoveAsync_WithNewTime_ChangesDateAndTime()
    {
        var repo = new InMemoryAppointmentRepository();
        var created = await repo.CreateAsync(BuildAppointment(date: "2031-01-15", time: "10:00"));

        var moved = await repo.MoveAsync(created.Id, "2031-02-01", "14:30");

        Assert.NotNull(moved);
        Assert.Equal("2031-02-01", moved!.Date);
        Assert.Equal("14:30", moved.Time);
    }

    [Fact]
    public async Task MoveAsync_AppointmentNotFound_ReturnsNull()
    {
        var repo = new InMemoryAppointmentRepository();

        var result = await repo.MoveAsync("missing-id", "2031-02-01");

        Assert.Null(result);
    }

    [Fact]
    public async Task HasConflictAsync_SameDateAndTimeNotCancelled_ReturnsTrue()
    {
        var repo = new InMemoryAppointmentRepository();
        await repo.CreateAsync(BuildAppointment(date: "2031-01-15", time: "10:00"));

        var result = await repo.HasConflictAsync("admin", "2031-01-15", "10:00", null);

        Assert.True(result);
    }

    [Fact]
    public async Task HasConflictAsync_CancelledAppointmentAtSameSlot_ReturnsFalse()
    {
        var repo = new InMemoryAppointmentRepository();
        var created = await repo.CreateAsync(BuildAppointment(date: "2031-01-15", time: "10:00"));
        created.Status = "cancelled";

        var result = await repo.HasConflictAsync("admin", "2031-01-15", "10:00", null);

        Assert.False(result);
    }

    [Fact]
    public async Task HasConflictAsync_ExcludingSameAppointmentId_ReturnsFalse()
    {
        var repo = new InMemoryAppointmentRepository();
        var created = await repo.CreateAsync(BuildAppointment(date: "2031-01-15", time: "10:00"));

        var result = await repo.HasConflictAsync("admin", "2031-01-15", "10:00", created.Id);

        Assert.False(result);
    }

    [Fact]
    public async Task HasConflictAsync_NoAppointmentAtSlot_ReturnsFalse()
    {
        var repo = new InMemoryAppointmentRepository();
        await repo.CreateAsync(BuildAppointment(date: "2031-01-15", time: "10:00"));

        var result = await repo.HasConflictAsync("admin", "2031-01-15", "11:00", null);

        Assert.False(result);
    }

    [Fact]
    public async Task DeleteAsync_AppointmentNotFound_ReturnsFalse()
    {
        var repo = new InMemoryAppointmentRepository();

        var deleted = await repo.DeleteAsync("missing-id");

        Assert.False(deleted);
    }

    [Fact]
    public async Task FindAsync_DateRange_ReturnsOnlyAppointmentsInsideRange()
    {
        var repo = new InMemoryAppointmentRepository();
        await repo.CreateAsync(BuildAppointment(phone: "9999-0001", date: "2031-01-10"));
        await repo.CreateAsync(BuildAppointment(phone: "9999-0002", date: "2031-01-20"));
        await repo.CreateAsync(BuildAppointment(phone: "9999-0003", date: "2031-02-05"));

        var result = await repo.FindAsync(date: "2031-01-01", endDate: "2031-01-31");

        Assert.Equal(2, result.Count(a => a.Phone.StartsWith("9999-")));
    }

    [Fact]
    public async Task FindAsync_ByQuery_MatchesClientNameOrPhone()
    {
        var repo = new InMemoryAppointmentRepository();
        var created = await repo.CreateAsync(BuildAppointment(clientName: "VeryUniqueClientName", phone: "9999-1234"));

        var byName = await repo.FindAsync(query: "veryuniqueclientname");
        var byPhone = await repo.FindAsync(query: "9999-1234");

        Assert.Contains(byName, a => a.Id == created.Id);
        Assert.Contains(byPhone, a => a.Id == created.Id);
    }

    [Fact]
    public async Task GetClientHistoryAsync_FiltersByClientIdAndCreatedBy_SortedNewestFirst()
    {
        var repo = new InMemoryAppointmentRepository();
        var clientId = Guid.NewGuid().ToString();
        var older = await repo.CreateAsync(new AppointmentEntity
        {
            ClientName = "History Client", Phone = "9999-5000", ClientId = clientId,
            Date = "2031-01-01", Time = "09:00", CreatedBy = "history-user",
        });
        var newer = await repo.CreateAsync(new AppointmentEntity
        {
            ClientName = "History Client", Phone = "9999-5000", ClientId = clientId,
            Date = "2031-01-10", Time = "09:00", CreatedBy = "history-user",
        });
        await repo.CreateAsync(new AppointmentEntity
        {
            ClientName = "Other Client", Phone = "9999-6000", ClientId = Guid.NewGuid().ToString(),
            Date = "2031-01-05", Time = "09:00", CreatedBy = "history-user",
        });

        var history = (await repo.GetClientHistoryAsync(clientId, "history-user")).ToList();

        Assert.Equal(2, history.Count);
        Assert.Equal(newer.Id, history[0].Id);
        Assert.Equal(older.Id, history[1].Id);
    }

    [Fact]
    public async Task FindByPhoneAsync_MatchesPhoneAndCreatedBy_ReturnsMostRecentlyCreated()
    {
        var repo = new InMemoryAppointmentRepository();
        await repo.CreateAsync(BuildAppointment(phone: "9999-7777", createdBy: "phone-user"));
        var latest = await repo.CreateAsync(BuildAppointment(phone: "9999-7777", createdBy: "phone-user"));

        var result = await repo.FindByPhoneAsync("9999-7777", "phone-user");

        Assert.NotNull(result);
        Assert.Equal(latest.Id, result!.Id);
    }

    [Fact]
    public async Task FindByPhoneAsync_NoMatch_ReturnsNull()
    {
        var repo = new InMemoryAppointmentRepository();

        var result = await repo.FindByPhoneAsync("0000-0000", "nobody");

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
        var repo = new InMemoryAppointmentRepository();
        await repo.CreateAsync(BuildAppointment(date: "2032-01-1", time: "10:00", createdBy: "barber-a"));

        Assert.False(await repo.HasConflictAsync("barber-b", "2032-01-1", "10:00", null));
        Assert.True(await repo.HasConflictAsync("barber-a", "2032-01-1", "10:00", null));
    }

    [Fact]
    public async Task HasOverlapAsync_30MinuteAppointmentBlocksTheNext15MinuteSpot_ButNotTheNextHalfHour()
    {
        var repo = new InMemoryAppointmentRepository();
        await repo.CreateAsync(WithDuration(BuildAppointment(date: "2032-01-2", time: "11:00"), 30));

        Assert.True(await repo.HasOverlapAsync("admin", "2032-01-2", 11 * 60 + 15, 15, null));
        Assert.True(await repo.HasOverlapAsync("admin", "2032-01-2", 10 * 60 + 45, 30, null));
        Assert.False(await repo.HasOverlapAsync("admin", "2032-01-2", 11 * 60 + 30, 30, null));
        Assert.False(await repo.HasOverlapAsync("admin", "2032-01-2", 10 * 60 + 30, 30, null));
    }

    [Fact]
    public async Task HasOverlapAsync_ShorteningTo15MinutesFreesTheNextSpot()
    {
        var repo = new InMemoryAppointmentRepository();
        var created = await repo.CreateAsync(WithDuration(BuildAppointment(date: "2032-01-3", time: "11:00"), 30));
        Assert.True(await repo.HasOverlapAsync("admin", "2032-01-3", 11 * 60 + 15, 15, null));

        await repo.ResizeAsync(created.Id, 15);

        Assert.False(await repo.HasOverlapAsync("admin", "2032-01-3", 11 * 60 + 15, 15, null));
    }

    [Fact]
    public async Task HasOverlapAsync_AppointmentWithoutStoredDuration_CountsAs30Minutes()
    {
        var repo = new InMemoryAppointmentRepository();
        await repo.CreateAsync(BuildAppointment(date: "2032-01-4", time: "11:00"));

        Assert.True(await repo.HasOverlapAsync("admin", "2032-01-4", 11 * 60 + 15, 15, null));
        Assert.False(await repo.HasOverlapAsync("admin", "2032-01-4", 11 * 60 + 30, 15, null));
    }

    [Fact]
    public async Task HasOverlapAsync_IgnoresCancelledOtherOwnersExcludedIdAndOtherDays()
    {
        var repo = new InMemoryAppointmentRepository();
        var mine = await repo.CreateAsync(BuildAppointment(date: "2032-01-5", time: "11:00"));
        var cancelled = await repo.CreateAsync(BuildAppointment(date: "2032-01-5", time: "12:00"));
        cancelled.Status = "cancelled";
        await repo.UpdateAsync(cancelled.Id, cancelled);
        await repo.CreateAsync(BuildAppointment(date: "2032-01-5", time: "13:00", createdBy: "barber-b"));
        await repo.CreateAsync(BuildAppointment(date: "2032-01-5B", time: "14:00"));

        Assert.False(await repo.HasOverlapAsync("admin", "2032-01-5", 11 * 60, 30, mine.Id));
        Assert.False(await repo.HasOverlapAsync("admin", "2032-01-5", 12 * 60, 30, null));
        Assert.False(await repo.HasOverlapAsync("admin", "2032-01-5", 13 * 60, 30, null));
        Assert.False(await repo.HasOverlapAsync("admin", "2032-01-5", 14 * 60, 30, null));
    }

    [Fact]
    public async Task ResizeAsync_SetsDurationAndOptionallyTheStartTime()
    {
        var repo = new InMemoryAppointmentRepository();
        var created = await repo.CreateAsync(WithDuration(BuildAppointment(date: "2032-01-6", time: "11:00"), 30));

        var shortened = await repo.ResizeAsync(created.Id, 15);

        Assert.Equal(15, shortened!.DurationMinutes);
        Assert.Equal("11:00", shortened.Time);

        var movedStart = await repo.ResizeAsync(created.Id, 15, "11:15");
        Assert.Equal("11:15", movedStart!.Time);
        Assert.Equal(15, (await repo.GetByIdAsync(created.Id))!.DurationMinutes);
        Assert.Null(await repo.ResizeAsync("APT-9999", 15));
    }

    [Fact]
    public async Task UpdateAsync_PersistsDurationMinutes()
    {
        var repo = new InMemoryAppointmentRepository();
        var created = await repo.CreateAsync(BuildAppointment(date: "2032-01-7", time: "11:00"));
        created.DurationMinutes = 45;

        var updated = await repo.UpdateAsync(created.Id, created);

        Assert.Equal(45, updated!.DurationMinutes);
        Assert.Equal(45, (await repo.GetByIdAsync(created.Id))!.DurationMinutes);
    }
}
