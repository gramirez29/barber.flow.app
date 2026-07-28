using Mongo2Go;
using MongoDB.Driver;

namespace Barber.Flow.Infrastructure.Tests.MongoDb;

/// <summary>
/// Spins up a single embedded mongod (via Mongo2Go) shared across all Mongo repository tests
/// in this assembly, avoiding one process start per test class. Each test gets its own
/// database name so tests never see each other's data.
/// </summary>
public sealed class MongoDbFixture : IDisposable
{
    private readonly MongoDbRunner _runner;

    public MongoDbFixture()
    {
        _runner = MongoDbRunner.Start(singleNodeReplSet: false);
    }

    public IMongoDatabase CreateDatabase()
    {
        var client = new MongoClient(_runner.ConnectionString);
        // MongoDB caps database names at 63 characters, so a fixed short prefix + GUID is used
        // instead of the calling test's name (some generated test names are too long on their own).
        var databaseName = $"test_{Guid.NewGuid():N}";
        return client.GetDatabase(databaseName);
    }

    public void Dispose() => _runner.Dispose();
}

[CollectionDefinition(Name)]
public sealed class MongoDbCollection : ICollectionFixture<MongoDbFixture>
{
    public const string Name = "MongoDb";
}
