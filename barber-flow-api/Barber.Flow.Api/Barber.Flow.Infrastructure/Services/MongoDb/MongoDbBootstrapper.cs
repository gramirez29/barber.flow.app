using Barber.Flow.Domain.Entities;
using Barber.Flow.Domain.ValueObjects;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using MongoDB.Bson.Serialization.Serializers;
using MongoDB.Driver;
using BarberEntity = Barber.Flow.Domain.Entities.Barber;

namespace Barber.Flow.Infrastructure.Services.MongoDb;

public sealed class MongoDbBootstrapper : IHostedService
{
    private readonly IMongoDatabase _database;
    private readonly ILogger<MongoDbBootstrapper> _logger;

    public MongoDbBootstrapper(IMongoDatabase database, ILogger<MongoDbBootstrapper> logger)
    {
        _database = database;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        RegisterClassMaps();
        await EnsureIndexesAsync(cancellationToken);
        await SeedInitialAdminUserAsync(cancellationToken);
        _logger.LogInformation("MongoDB bootstrapped against '{Database}'.", _database.DatabaseNamespace.DatabaseName);
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    private static void RegisterClassMaps()
    {
        if (!BsonClassMap.IsClassMapRegistered(typeof(Client)))
            BsonClassMap.RegisterClassMap<Client>(cm =>
            {
                cm.AutoMap();
                cm.SetIgnoreExtraElements(true);
            });

        if (!BsonClassMap.IsClassMapRegistered(typeof(BarberEntity)))
            BsonClassMap.RegisterClassMap<BarberEntity>(cm =>
            {
                cm.AutoMap();
                cm.SetIgnoreExtraElements(true);
            });

        if (!BsonClassMap.IsClassMapRegistered(typeof(BarberSettings)))
            BsonClassMap.RegisterClassMap<BarberSettings>(cm =>
            {
                cm.AutoMap();
                cm.SetIgnoreExtraElements(true);
            });

        if (!BsonClassMap.IsClassMapRegistered(typeof(Appointments)))
            BsonClassMap.RegisterClassMap<Appointments>(cm =>
            {
                cm.AutoMap();
                cm.SetIgnoreExtraElements(true);
            });

        if (!BsonClassMap.IsClassMapRegistered(typeof(BarberShop)))
            BsonClassMap.RegisterClassMap<BarberShop>(cm =>
            {
                cm.AutoMap();
                cm.SetIgnoreExtraElements(true);
            });

        if (!BsonClassMap.IsClassMapRegistered(typeof(User)))
            BsonClassMap.RegisterClassMap<User>(cm =>
            {
                cm.AutoMap();
                cm.SetIgnoreExtraElements(true);
                cm.MapIdMember(u => u.Id)
                  .SetSerializer(new GuidSerializer(GuidRepresentation.Standard));
            });
    }

    /// <summary>
    /// Ensures that all necessary indexes are created for the MongoDB collections to optimize query performance.
    /// </summary>
    /// <param name="cancellationToken">A token to monitor for cancellation requests.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    private async Task EnsureIndexesAsync(CancellationToken cancellationToken)
    {
        await CreateClientIndexesAsync(cancellationToken);
        await CreateAppointmentIndexesAsync(cancellationToken);
        await CreateBarberIndexesAsync(cancellationToken);
        await CreateBarberShopIndexesAsync(cancellationToken);
        await CreateUserIndexesAsync(cancellationToken);
    }

    /// <summary>
    /// Creates indexes for the Clients collection to optimize query performance based on common access patterns.
    /// </summary>
    /// <param name="cancellationToken">A token to monitor for cancellation requests.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    private async Task CreateClientIndexesAsync(CancellationToken cancellationToken = default)
    {
        // Clients collection indexes
        var clients = _database.GetCollection<Client>("clients");
        var clientIndexes = new List<CreateIndexModel<Client>>
        {
            new(Builders<Client>.IndexKeys.Ascending(c => c.CreatedBy), new CreateIndexOptions { Name = "idx_clients_createdBy" }),
            new(Builders<Client>.IndexKeys.Ascending(c => c.ShopId), new CreateIndexOptions { Name = "idx_clients_shopId" }),
            new(Builders<Client>.IndexKeys.Ascending(c => c.Phone)
                .Ascending(c => c.CreatedBy), new CreateIndexOptions { Name = "idx_clients_phone_createdBy" }),
        };
        await clients.Indexes.CreateManyAsync(clientIndexes, cancellationToken);
    }

    /// <summary>
    /// Creates indexes for the Appointments collection to optimize query performance based on common access patterns.
    /// </summary>
    /// <param name="cancellationToken">A token to monitor for cancellation requests.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    private async Task CreateAppointmentIndexesAsync(CancellationToken cancellationToken = default)
    {
        // Appointments collection indexes
        var appointments = _database.GetCollection<Appointments>("appointments");
        var appointmentIndexes = new List<CreateIndexModel<Appointments>>
        {
            new(
                Builders<Appointments>.IndexKeys.Ascending(a => a.ClientId),
                new CreateIndexOptions { Name = "idx_appointments_clientId" }),
            new(
                Builders<Appointments>.IndexKeys.Ascending(a => a.ShopId),
                new CreateIndexOptions { Name = "idx_appointments_shopId" }),
            new(
                Builders<Appointments>.IndexKeys.Ascending(a => a.CreatedBy),
                new CreateIndexOptions { Name = "idx_appointments_createdBy" }),
            new(
                Builders<Appointments>.IndexKeys
                    .Ascending(a => a.Date)
                    .Ascending(a => a.CreatedBy),
                new CreateIndexOptions { Name = "idx_appointments_date_createdBy" }),
        };
        await appointments.Indexes.CreateManyAsync(appointmentIndexes, cancellationToken);
    }

    /// <summary>
    /// Creates indexes for the Barbers collection to optimize query performance based on common access patterns.
    /// </summary>
    /// <param name="cancellationToken">A token to monitor for cancellation requests.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    private async Task CreateBarberIndexesAsync(CancellationToken cancellationToken = default)
    {
        // Barbers collection indexes
        var barbers = _database.GetCollection<BarberEntity>("barbers");
        var barberIndexes = new List<CreateIndexModel<BarberEntity>>
        {
            new(
                Builders<BarberEntity>.IndexKeys.Ascending(b => b.ShopId),
                new CreateIndexOptions { Name = "idx_barbers_shopId" }),
            new(
                Builders<BarberEntity>.IndexKeys.Ascending(b => b.CreatedBy),
                new CreateIndexOptions { Name = "idx_barbers_createdBy" }),
        };
        await barbers.Indexes.CreateManyAsync(barberIndexes, cancellationToken);
    }

    /// <summary>
    /// Creates indexes for the BarberShops collection to optimize query performance based on common access patterns.
    /// </summary>
    /// <param name="cancellationToken">A token to monitor for cancellation requests.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    private async Task CreateBarberShopIndexesAsync(CancellationToken cancellationToken = default)
    {
        // BarberShops collection indexes
        var barberShops = _database.GetCollection<BarberShop>("barberShops");
        var barberShopIndexes = new List<CreateIndexModel<BarberShop>>
        {
            new(
                Builders<BarberShop>.IndexKeys.Ascending(bs => bs.CreatedBy),
                new CreateIndexOptions { Name = "idx_barbershops_createdBy" }),
            new(
                Builders<BarberShop>.IndexKeys.Ascending(bs => bs.Name),
                new CreateIndexOptions { Name = "idx_barbershops_name" }),
        };
        await barberShops.Indexes.CreateManyAsync(barberShopIndexes, cancellationToken);
    }

    /// <summary>
    /// Creates indexes for the Users collection to optimize query performance and enforce unique usernames.
    /// </summary>
    /// <param name="cancellationToken">A token to monitor for cancellation requests.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    private async Task CreateUserIndexesAsync(CancellationToken cancellationToken = default)
    {
        // Users collection indexes
        var users = _database.GetCollection<User>("users");
        var userIndexes = new List<CreateIndexModel<User>>
        {
            new(
                Builders<User>.IndexKeys.Ascending(u => u.UserName),
                new CreateIndexOptions { Name = "idx_users_userName", Unique = true }),
            new(
                Builders<User>.IndexKeys.Ascending(u => u.Email),
                new CreateIndexOptions { Name = "idx_users_email" }),
        };
        await users.Indexes.CreateManyAsync(userIndexes, cancellationToken);
    }

    /// <summary>
    /// Seeds the initial admin user the first time the Users collection is empty, mirroring the
    /// default credentials used by InMemoryUserRepository so login keeps working right after
    /// switching from in-memory storage to MongoDB.
    /// </summary>
    /// <param name="cancellationToken">A token to monitor for cancellation requests.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    private async Task SeedInitialAdminUserAsync(CancellationToken cancellationToken = default)
    {
        var users = _database.GetCollection<User>("users");
        var hasAnyUser = await users.Find(FilterDefinition<User>.Empty).AnyAsync(cancellationToken);
        if (hasAnyUser) return;

        var adminUser = new User
        {
            Id = Guid.Parse("1dc8d729-51f9-4633-aaab-46c9273bf44e"),
            Name = "Admin User",
            UserName = "admin",
            Password = "password",
            Email = "g.raba29@gmail.com",
            Role = "Admin"
        };

        await users.InsertOneAsync(adminUser, cancellationToken: cancellationToken);
        _logger.LogInformation("Seeded initial admin user '{UserName}' into MongoDB.", adminUser.UserName);
    }
}
