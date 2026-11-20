using Barber.Flow.Domain.Entities;
using Barber.Flow.Infrastructure.Services.MongoDb;
using Microsoft.Extensions.Logging.Abstractions;
using MongoDB.Driver;
using BarberEntity = Barber.Flow.Domain.Entities.Barber;

namespace Barber.Flow.Infrastructure.Tests.MongoDb;

[Collection(MongoDbCollection.Name)]
public class MongoDbBootstrapperTests
{
    private readonly MongoDbFixture _fixture;

    public MongoDbBootstrapperTests(MongoDbFixture fixture) => _fixture = fixture;

    private static MongoDbBootstrapper CreateSut(MongoDB.Driver.IMongoDatabase database) =>
        new(database, new MongoDbBarberShopRepository(database), NullLogger<MongoDbBootstrapper>.Instance);

    [Fact]
    public async Task StartAsync_CalledTwice_DoesNotThrow()
    {
        var database = _fixture.CreateDatabase();
        var sut = CreateSut(database);

        await sut.StartAsync(CancellationToken.None);
        // Re-running on an already-bootstrapped database (e.g. app restart) must be safe:
        // class map registration is guarded, and index creation must be idempotent.
        await sut.StartAsync(CancellationToken.None);
    }

    [Fact]
    public async Task StartAsync_EmptyUsersCollection_SeedsExactlyOneAdminUser()
    {
        var database = _fixture.CreateDatabase();
        var sut = CreateSut(database);

        await sut.StartAsync(CancellationToken.None);

        var users = database.GetCollection<User>("users");
        var count = await users.CountDocumentsAsync(FilterDefinition<User>.Empty);
        Assert.Equal(1, count);

        var admin = await users.Find(FilterDefinition<User>.Empty).FirstOrDefaultAsync();
        Assert.Equal("admin", admin.UserName);
    }

    [Fact]
    public async Task StartAsync_UsersCollectionAlreadyHasUsers_DoesNotSeedAdditionalAdmin()
    {
        var database = _fixture.CreateDatabase();
        var users = database.GetCollection<User>("users");
        await users.InsertOneAsync(new User { UserName = "existing-barber", Password = "x", Email = "b@example.com" });

        var sut = CreateSut(database);
        await sut.StartAsync(CancellationToken.None);

        var count = await users.CountDocumentsAsync(FilterDefinition<User>.Empty);
        Assert.Equal(1, count);
    }

    [Fact]
    public async Task StartAsync_BarberWithoutShopId_BackfillsShopIdAndPropagatesToItsAppointmentsAndClients()
    {
        var database = _fixture.CreateDatabase();
        var barbers = database.GetCollection<BarberEntity>("barbers");
        var appointments = database.GetCollection<Appointments>("appointments");
        var clients = database.GetCollection<Client>("clients");

        await barbers.InsertOneAsync(new BarberEntity { Id = "CRB-0001", UserName = "legacybarber", BarberName = "Legacy Barber", CreatedBy = "legacybarber", ShopId = null });
        await appointments.InsertOneAsync(new Appointments { Id = "APT-0001", ClientName = "Test", Phone = "8888-0000", Date = "2031-01-01", Time = "10:00", CreatedBy = "legacybarber", ShopId = null });
        await clients.InsertOneAsync(new Client { Id = "CLI-0001", FirstName = "Test", LastName = "Client", Phone = "8888-0001", CreatedBy = "legacybarber", ShopId = null });

        var sut = CreateSut(database);
        await sut.StartAsync(CancellationToken.None);

        var updatedBarber = await barbers.Find(b => b.Id == "CRB-0001").FirstOrDefaultAsync();
        Assert.False(string.IsNullOrEmpty(updatedBarber.ShopId));

        var updatedAppointment = await appointments.Find(a => a.Id == "APT-0001").FirstOrDefaultAsync();
        Assert.Equal(updatedBarber.ShopId, updatedAppointment.ShopId);

        var updatedClient = await clients.Find(c => c.Id == "CLI-0001").FirstOrDefaultAsync();
        Assert.Equal(updatedBarber.ShopId, updatedClient.ShopId);
    }

    [Fact]
    public async Task StartAsync_CalledTwice_DoesNotBackfillShopIdAgain()
    {
        var database = _fixture.CreateDatabase();
        var barbers = database.GetCollection<BarberEntity>("barbers");
        await barbers.InsertOneAsync(new BarberEntity { Id = "CRB-0001", UserName = "legacybarber", BarberName = "Legacy Barber", CreatedBy = "legacybarber", ShopId = null });

        var sut = CreateSut(database);
        await sut.StartAsync(CancellationToken.None);
        var firstShopId = (await barbers.Find(b => b.Id == "CRB-0001").FirstOrDefaultAsync()).ShopId;

        await sut.StartAsync(CancellationToken.None);
        var secondShopId = (await barbers.Find(b => b.Id == "CRB-0001").FirstOrDefaultAsync()).ShopId;

        Assert.Equal(firstShopId, secondShopId);
    }

    private static Client BuildClient(string owner, string phone, string? phoneNormalized) => new()
    {
        FirstName = "Cliente",
        LastName = phone,
        Phone = phone,
        PhoneNormalized = phoneNormalized,
        CreatedBy = owner,
        UpdatedBy = owner,
    };

    [Fact]
    public async Task StartAsync_BackfillsPhoneNormalizedForLegacyClients()
    {
        var database = _fixture.CreateDatabase();
        var clients = database.GetCollection<Client>("clients");
        // Legacy documents predate the PhoneNormalized field entirely.
        await database.GetCollection<MongoDB.Bson.BsonDocument>("clients").InsertManyAsync(new[]
        {
            new MongoDB.Bson.BsonDocument { { "_id", "legacy-1" }, { "Phone", "+506 8888-0000" }, { "CreatedBy", "barber1" } },
            new MongoDB.Bson.BsonDocument { { "_id", "legacy-2" }, { "Phone", "sin numero" }, { "CreatedBy", "barber1" } },
        });

        await CreateSut(database).StartAsync(CancellationToken.None);

        Assert.Equal("88880000", (await clients.Find(c => c.Id == "legacy-1").FirstAsync()).PhoneNormalized);
        Assert.Null((await clients.Find(c => c.Id == "legacy-2").FirstAsync()).PhoneNormalized);
    }

    [Fact]
    public async Task StartAsync_CreatesUniqueClientPhoneIndex_SecondCreateWithSamePhoneIsRejected()
    {
        var database = _fixture.CreateDatabase();
        await CreateSut(database).StartAsync(CancellationToken.None);
        var repo = new MongoDbClientRepository(database);

        await repo.CreateAsync(BuildClient("barber1", "8888-0000", "88880000"));

        await Assert.ThrowsAsync<Barber.Flow.Domain.Exceptions.ClientPhoneConflictException>(
            () => repo.CreateAsync(BuildClient("barber1", "+506 8888 0000", "88880000")));
    }

    [Fact]
    public async Task ClientPhoneIndex_SamePhoneForDifferentBarbers_IsAllowed()
    {
        var database = _fixture.CreateDatabase();
        await CreateSut(database).StartAsync(CancellationToken.None);
        var repo = new MongoDbClientRepository(database);

        await repo.CreateAsync(BuildClient("barber1", "8888-0000", "88880000"));
        await repo.CreateAsync(BuildClient("barber2", "8888-0000", "88880000"));

        Assert.Equal(2, await database.GetCollection<Client>("clients").CountDocumentsAsync(FilterDefinition<Client>.Empty));
    }

    [Fact]
    public async Task ClientPhoneIndex_ClientsWithoutDigits_AreExempt()
    {
        var database = _fixture.CreateDatabase();
        await CreateSut(database).StartAsync(CancellationToken.None);
        var repo = new MongoDbClientRepository(database);

        await repo.CreateAsync(BuildClient("barber1", "", null));
        await repo.CreateAsync(BuildClient("barber1", "n/a", null));

        Assert.Equal(2, await database.GetCollection<Client>("clients").CountDocumentsAsync(FilterDefinition<Client>.Empty));
    }

    [Fact]
    public async Task ClientPhoneIndex_UpdatingToAnotherClientsPhone_IsRejected()
    {
        var database = _fixture.CreateDatabase();
        await CreateSut(database).StartAsync(CancellationToken.None);
        var repo = new MongoDbClientRepository(database);
        await repo.CreateAsync(BuildClient("barber1", "8888-0000", "88880000"));
        var other = await repo.CreateAsync(BuildClient("barber1", "7777-1111", "77771111"));

        var patch = BuildClient("barber1", "8888-0000", "88880000");

        await Assert.ThrowsAsync<Barber.Flow.Domain.Exceptions.ClientPhoneConflictException>(
            () => repo.UpdateAsync(other.Id, patch));
    }

    [Fact]
    public async Task StartAsync_PreexistingDuplicatePhones_DoesNotThrowAndLeavesThemEditable()
    {
        var database = _fixture.CreateDatabase();
        var clients = database.GetCollection<Client>("clients");
        // Duplicates created before the rule existed: the unique index can't be built, but the app must still boot.
        await clients.InsertManyAsync(new[]
        {
            BuildClient("barber1", "8888-0000", null),
            BuildClient("barber1", "88880000", null),
        });

        await CreateSut(database).StartAsync(CancellationToken.None);

        Assert.Equal(2, await clients.CountDocumentsAsync(FilterDefinition<Client>.Empty));
        // Backfill still ran, so the data is ready for the index once the user deletes one by hand.
        Assert.All(await clients.Find(FilterDefinition<Client>.Empty).ToListAsync(), c => Assert.Equal("88880000", c.PhoneNormalized));
    }
}
