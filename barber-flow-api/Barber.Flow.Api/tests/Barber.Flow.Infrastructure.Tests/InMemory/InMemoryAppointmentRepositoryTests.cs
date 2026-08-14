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

        var result = await repo.HasConflictAsync("2031-01-15", "10:00", null);

        Assert.True(result);
    }

    [Fact]
    public async Task HasConflictAsync_CancelledAppointmentAtSameSlot_ReturnsFalse()
    {
        var repo = new InMemoryAppointmentRepository();
        var created = await repo.CreateAsync(BuildAppointment(date: "2031-01-15", time: "10:00"));
        created.Status = "cancelled";

        var result = await repo.HasConflictAsync("2031-01-15", "10:00", null);

        Assert.False(result);
    }

    [Fact]
    public async Task HasConflictAsync_ExcludingSameAppointmentId_ReturnsFalse()
    {
        var repo = new InMemoryAppointmentRepository();
        var created = await repo.CreateAsync(BuildAppointment(date: "2031-01-15", time: "10:00"));

        var result = await repo.HasConflictAsync("2031-01-15", "10:00", created.Id);

        Assert.False(result);
    }

    [Fact]
    public async Task HasConflictAsync_NoAppointmentAtSlot_ReturnsFalse()
    {
        var repo = new InMemoryAppointmentRepository();
        await repo.CreateAsync(BuildAppointment(date: "2031-01-15", time: "10:00"));

        var result = await repo.HasConflictAsync("2031-01-15", "11:00", null);

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
}
