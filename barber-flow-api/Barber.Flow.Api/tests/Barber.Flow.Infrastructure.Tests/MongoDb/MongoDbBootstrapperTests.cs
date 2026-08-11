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
}
