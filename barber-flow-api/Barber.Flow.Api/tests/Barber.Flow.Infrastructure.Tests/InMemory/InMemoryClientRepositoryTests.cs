using Barber.Flow.Domain.Entities;
using Barber.Flow.Infrastructure.Services.InMemory;

namespace Barber.Flow.Infrastructure.Tests.InMemory;

public class InMemoryClientRepositoryTests
{
    private static Client BuildClient(string firstName, string lastName, string phone) => new()
    {
        FirstName = firstName,
        LastName = lastName,
        Phone = phone,
    };

    [Fact]
    public async Task CreateAsync_AssignsIdAndTimestamps()
    {
        var repo = new InMemoryClientRepository();
        var client = BuildClient("UniqueFirstName1", "Test", "0000-0001");

        var created = await repo.CreateAsync(client);

        Assert.False(string.IsNullOrWhiteSpace(created.Id));
        Assert.Equal(created.CreatedAt, created.UpdatedAt);
    }

    [Fact]
    public async Task UpdateAsync_ClientNotFound_ReturnsNull()
    {
        var repo = new InMemoryClientRepository();

        var result = await repo.UpdateAsync("missing-id", BuildClient("X", "Y", "0000-0000"));

        Assert.Null(result);
    }

    [Fact]
    public async Task UpdateAsync_ExistingClient_UpdatesFields()
    {
        var repo = new InMemoryClientRepository();
        var created = await repo.CreateAsync(BuildClient("UniqueFirstName2", "Test", "0000-0002"));

        var updated = await repo.UpdateAsync(created.Id, BuildClient("Renamed", "Test", "0000-0002"));

        Assert.NotNull(updated);
        Assert.Equal("Renamed", updated!.FirstName);
    }

    [Fact]
    public async Task DeleteAsync_ExistingClient_RemovesItAndReturnsTrue()
    {
        var repo = new InMemoryClientRepository();
        var created = await repo.CreateAsync(BuildClient("UniqueFirstName3", "Test", "0000-0003"));

        var deleted = await repo.DeleteAsync(created.Id);

        Assert.True(deleted);
        Assert.Null(await repo.GetByIdAsync(created.Id));
    }

    [Fact]
    public async Task DeleteAsync_ClientNotFound_ReturnsFalse()
    {
        var repo = new InMemoryClientRepository();

        var deleted = await repo.DeleteAsync("missing-id");

        Assert.False(deleted);
    }

    [Fact]
    public async Task FindAsync_QueryMatchesFirstNameLastNameOrPhone()
    {
        var repo = new InMemoryClientRepository();
        var created = await repo.CreateAsync(BuildClient("VeryUniqueFirstName", "VeryUniqueLastName", "0000-9999"));

        var byFirstName = await repo.FindAsync("veryuniquefirstname");
        var byPhone = await repo.FindAsync("0000-9999");
        var byNoMatch = await repo.FindAsync("no-such-client-in-this-store");

        Assert.Contains(byFirstName, c => c.Id == created.Id);
        Assert.Contains(byPhone, c => c.Id == created.Id);
        Assert.DoesNotContain(byNoMatch, c => c.Id == created.Id);
        Assert.Empty(byNoMatch);
    }

    [Fact]
    public async Task FindAsync_NoQuery_ReturnsSeededClientsTooIncludingCreatedOnes()
    {
        var repo = new InMemoryClientRepository();
        var created = await repo.CreateAsync(BuildClient("AnotherUniqueFirstName", "Test", "0000-0004"));

        var all = await repo.FindAsync();

        // This repository ships with seeded demo clients (see constructor) - a query-less
        // find must still include newly created ones alongside the seed data.
        Assert.Contains(all, c => c.Id == created.Id);
        Assert.True(all.Count() > 1);
    }
}
