using Barber.Flow.Domain.Entities;
using Barber.Flow.Infrastructure.Services.MongoDb;
using Microsoft.Extensions.Logging.Abstractions;
using MongoDB.Driver;

namespace Barber.Flow.Infrastructure.Tests.MongoDb;

[Collection(MongoDbCollection.Name)]
public class MongoDbBootstrapperTests
{
    private readonly MongoDbFixture _fixture;

    public MongoDbBootstrapperTests(MongoDbFixture fixture) => _fixture = fixture;

    private static MongoDbBootstrapper CreateSut(MongoDB.Driver.IMongoDatabase database) =>
        new(database, NullLogger<MongoDbBootstrapper>.Instance);

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
}
