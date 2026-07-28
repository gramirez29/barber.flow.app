using Barber.Flow.Domain.Entities;
using Barber.Flow.Infrastructure.Services.MongoDb;

namespace Barber.Flow.Infrastructure.Tests.MongoDb;

[Collection(MongoDbCollection.Name)]
public class MongoDbClientRepositoryTests
{
    private readonly MongoDbFixture _fixture;

    public MongoDbClientRepositoryTests(MongoDbFixture fixture) => _fixture = fixture;

    private MongoDbClientRepository CreateSut() => new(_fixture.CreateDatabase());

    private static Client BuildClient(string firstName = "Juan", string lastName = "Perez", string phone = "8888-0000") => new()
    {
        FirstName = firstName,
        LastName = lastName,
        Phone = phone,
        CreatedBy = "admin",
        UpdatedBy = "admin",
    };

    [Fact]
    public async Task CreateAsync_PersistsClientAndReturnsIt()
    {
        var sut = CreateSut();
        var client = BuildClient();

        var created = await sut.CreateAsync(client);

        Assert.Equal(client.Id, created.Id);
        var stored = await sut.GetByIdAsync(client.Id);
        Assert.NotNull(stored);
        Assert.Equal("Juan", stored!.FirstName);
    }

    [Fact]
    public async Task UpdateAsync_OnlyChangesMappedFields()
    {
        var sut = CreateSut();
        var client = await sut.CreateAsync(BuildClient());
        var originalCreatedAt = client.CreatedAt;

        var patch = new Client
        {
            FirstName = "Juan Actualizado",
            LastName = client.LastName,
            Phone = client.Phone,
            Active = false,
        };

        var updated = await sut.UpdateAsync(client.Id, patch);

        Assert.NotNull(updated);
        Assert.Equal("Juan Actualizado", updated!.FirstName);
        Assert.False(updated.Active);
        // CreatedBy is intentionally not part of the update - verifying it survives an update
        // documents that Update.Set(...) list, which protects it from accidental overwrite.
        Assert.Equal("admin", updated.CreatedBy);
        // MongoDB stores DateTime with millisecond precision, so compare with that tolerance.
        Assert.Equal(originalCreatedAt, updated.CreatedAt, TimeSpan.FromMilliseconds(1));
    }

    [Fact]
    public async Task UpdateAsync_ClientNotFound_ReturnsNull()
    {
        var sut = CreateSut();

        var result = await sut.UpdateAsync(Guid.NewGuid().ToString(), BuildClient());

        Assert.Null(result);
    }

    [Fact]
    public async Task DeleteAsync_ExistingClient_RemovesItAndReturnsTrue()
    {
        var sut = CreateSut();
        var client = await sut.CreateAsync(BuildClient());

        var deleted = await sut.DeleteAsync(client.Id);

        Assert.True(deleted);
        Assert.Null(await sut.GetByIdAsync(client.Id));
    }

    [Fact]
    public async Task DeleteAsync_ClientNotFound_ReturnsFalse()
    {
        var sut = CreateSut();

        var deleted = await sut.DeleteAsync(Guid.NewGuid().ToString());

        Assert.False(deleted);
    }

    [Fact]
    public async Task FindAsync_QueryMatchesFirstNameLastNameOrPhone()
    {
        var sut = CreateSut();
        await sut.CreateAsync(BuildClient("Juan", "Perez", "8888-0001"));
        await sut.CreateAsync(BuildClient("Maria", "Gomez", "8888-0002"));

        var byFirstName = await sut.FindAsync("juan");
        var byPhone = await sut.FindAsync("8888-0002");
        var byNoMatch = await sut.FindAsync("no-such-client");

        Assert.Single(byFirstName);
        Assert.Equal("Juan", byFirstName.First().FirstName);
        Assert.Single(byPhone);
        Assert.Equal("Maria", byPhone.First().FirstName);
        Assert.Empty(byNoMatch);
    }

    [Fact]
    public async Task FindAsync_QueryWithRegexSpecialCharacters_DoesNotThrow()
    {
        var sut = CreateSut();
        await sut.CreateAsync(BuildClient());

        var result = await sut.FindAsync("(Juan+*)");

        Assert.Empty(result);
    }

    [Fact]
    public async Task FindAsync_WithPagination_ReturnsRequestedPage()
    {
        var sut = CreateSut();
        for (var i = 1; i <= 5; i++)
        {
            await sut.CreateAsync(BuildClient($"Client{i}", "Test", $"8888-000{i}"));
        }

        var firstPage = await sut.FindAsync(page: 1, pageSize: 2);
        var secondPage = await sut.FindAsync(page: 2, pageSize: 2);

        Assert.Equal(2, firstPage.Count());
        Assert.Equal(2, secondPage.Count());
        Assert.Empty(firstPage.Select(c => c.Id).Intersect(secondPage.Select(c => c.Id)));
    }
}
