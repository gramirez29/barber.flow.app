using Barber.Flow.Domain.Entities;
using Barber.Flow.Domain.Interfaces;
using Barber.Flow.Domain.ValueObjects;
using Barber.Flow.Infrastructure.Services.Auth;
using System.Linq;
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
    private readonly IBarberShopRepository _barberShopRepo;
    private readonly ILogger<MongoDbBootstrapper> _logger;

    public MongoDbBootstrapper(IMongoDatabase database, IBarberShopRepository barberShopRepo, ILogger<MongoDbBootstrapper> logger)
    {
        _database = database;
        _barberShopRepo = barberShopRepo;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        RegisterClassMaps();
        await EnsureIndexesAsync(cancellationToken);
        await SeedInitialAdminUserAsync(cancellationToken);
        await EnsureBarberShopIdsAsync(cancellationToken);
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

        await BackfillClientPhoneNormalizedAsync(clients, cancellationToken);

        // One phone per barber, enforced by the store so two simultaneous creates can't both pass
        // ClientService's in-memory check. Partial: clients without digits (null) are exempt, and
        // different barbers may share a number. Created separately and swallowing a duplicate-key
        // failure (same approach as the users.Email index): environments that already hold
        // duplicate phones (allowed before this rule, see ClientService) must keep booting; the
        // index simply isn't enforced until the user deletes the duplicates by hand.
        try
        {
            await clients.Indexes.CreateOneAsync(
                new CreateIndexModel<Client>(
                    Builders<Client>.IndexKeys.Ascending(c => c.CreatedBy).Ascending(c => c.PhoneNormalized),
                    new CreateIndexOptions<Client>
                    {
                        Name = "uq_clients_createdBy_phoneNormalized",
                        Unique = true,
                        PartialFilterExpression = Builders<Client>.Filter.Type(c => c.PhoneNormalized, BsonType.String),
                    }),
                cancellationToken: cancellationToken);
        }
        catch (MongoCommandException ex) when (ex.CodeName == "DuplicateKey" || ex.Code == 11000)
        {
            _logger.LogError(ex,
                "Could not create the unique (CreatedBy, PhoneNormalized) index on clients - some barber already has " +
                "duplicate phones. Simultaneous duplicate creates are not blocked until those are deleted by hand.");
        }
    }

    /// <summary>
    /// Idempotent backfill of <see cref="Client.PhoneNormalized"/> for clients created before the field
    /// existed (the unique index needs it). Matches both a missing and a null field; clients whose phone
    /// has no digits legitimately stay null and are simply skipped (a cheap re-read on each startup).
    /// </summary>
    private static async Task BackfillClientPhoneNormalizedAsync(IMongoCollection<Client> clients, CancellationToken cancellationToken)
    {
        var pending = await clients
            .Find(Builders<Client>.Filter.Eq(c => c.PhoneNormalized, null))
            .Project(c => new { c.Id, c.Phone })
            .ToListAsync(cancellationToken);

        var writes = pending
            .Select(c => (c.Id, Normalized: PhoneNormalizer.Normalize(c.Phone)))
            .Where(c => c.Normalized is not null)
            .Select(c => (WriteModel<Client>)new UpdateOneModel<Client>(
                Builders<Client>.Filter.Eq(x => x.Id, c.Id),
                Builders<Client>.Update.Set(x => x.PhoneNormalized, c.Normalized)))
            .ToList();
        if (writes.Count == 0) return;

        await clients.BulkWriteAsync(writes, cancellationToken: cancellationToken);
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

        // The username is the tenant identity (appointments/clients are owned by it, and barber
        // lookups resolve it case-insensitively), so two barbers must never share one. The
        // case-insensitive collation makes "Jaden01" and "jaden01" collide here too. Partial so
        // legacy barbers with a blank username are exempt. Created separately and swallowing a
        // duplicate-key failure (same approach as the users.Email index): an environment that
        // already holds duplicates must keep booting until they're cleaned up by hand.
        try
        {
            await barbers.Indexes.CreateOneAsync(
                new CreateIndexModel<BarberEntity>(
                    Builders<BarberEntity>.IndexKeys.Ascending(b => b.UserName),
                    new CreateIndexOptions<BarberEntity>
                    {
                        Name = "uq_barbers_userName",
                        Unique = true,
                        Collation = new Collation("en", strength: CollationStrength.Secondary),
                        PartialFilterExpression = Builders<BarberEntity>.Filter.Gt(b => b.UserName, string.Empty),
                    }),
                cancellationToken: cancellationToken);
        }
        catch (MongoCommandException ex) when (ex.CodeName == "DuplicateKey" || ex.Code == 11000)
        {
            _logger.LogError(ex,
                "Could not create the unique barbers.UserName index - two barbers already share a username. " +
                "Duplicates are only blocked by the service-level check until they are cleaned up by hand.");
        }
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
        await EnsureUniqueUserNameIndexAsync(users, cancellationToken);

        // Email is looked up by the OTP password-recovery flow (AuthService), which assumes it
        // resolves to exactly one account - two users sharing an email let a reset silently land
        // on the wrong one (incident 2026-08-21: an admin-seeded account and a newly-created
        // barber shared an email, and a password reset intended for the barber changed the
        // admin's password instead). Created separately, and swallows a duplicate-key failure
        // instead of crashing startup, because environments with pre-existing duplicate emails
        // (from before this constraint existed) need to keep booting while those get cleaned up
        // manually - BarbersApi.CreateBarberAsync is what actually prevents new duplicates.
        try
        {
            // Drop the old non-unique "idx_users_email" first if present - Mongo rejects creating
            // a differently-configured index over the same key pattern under a new name.
            var existingNames = (await users.Indexes.List(cancellationToken).ToListAsync(cancellationToken))
                .Select(i => i["name"].AsString);
            if (existingNames.Contains("idx_users_email"))
            {
                await users.Indexes.DropOneAsync("idx_users_email", cancellationToken);
            }

            await users.Indexes.CreateOneAsync(
                new CreateIndexModel<User>(
                    Builders<User>.IndexKeys.Ascending(u => u.Email),
                    new CreateIndexOptions { Name = "idx_users_email", Unique = true }),
                cancellationToken: cancellationToken);
        }
        catch (MongoCommandException ex) when (ex.CodeName == "DuplicateKey" || ex.Code == 11000)
        {
            _logger.LogError(ex,
                "Could not create a unique index on users.Email - duplicate emails already exist. " +
                "Password recovery may resolve to the wrong account until these are cleaned up manually.");
        }
    }

    /// <summary>
    /// Guarantees one account per username, ignoring case. Every lookup (login, password reset, barber
    /// settings) already matches usernames case-insensitively, so a case-sensitive unique index let
    /// "Jaden01" and "jaden01" coexist as two accounts that all those lookups then confuse. The old
    /// case-sensitive index (<c>idx_users_userName</c>) is replaced by a case-insensitive one, but only
    /// after the new one was built successfully: if case-variant duplicates already exist the new index
    /// can't be created, so the old one is kept and an error is logged instead of leaving no guard at all.
    /// </summary>
    private async Task EnsureUniqueUserNameIndexAsync(IMongoCollection<User> users, CancellationToken cancellationToken)
    {
        const string legacyName = "idx_users_userName";
        var keys = Builders<User>.IndexKeys.Ascending(u => u.UserName);

        try
        {
            await users.Indexes.CreateOneAsync(
                new CreateIndexModel<User>(keys, new CreateIndexOptions
                {
                    Name = "uq_users_userName_ci",
                    Unique = true,
                    Collation = new Collation("en", strength: CollationStrength.Secondary),
                }),
                cancellationToken: cancellationToken);

            var existingNames = (await users.Indexes.List(cancellationToken).ToListAsync(cancellationToken))
                .Select(i => i["name"].AsString);
            if (existingNames.Contains(legacyName))
            {
                await users.Indexes.DropOneAsync(legacyName, cancellationToken);
            }
        }
        catch (MongoCommandException ex) when (ex.CodeName == "DuplicateKey" || ex.Code == 11000)
        {
            _logger.LogError(ex,
                "Could not create the case-insensitive unique users.UserName index - usernames that differ only in case " +
                "already exist. Keeping the case-sensitive index until they are cleaned up by hand.");

            await users.Indexes.CreateOneAsync(
                new CreateIndexModel<User>(keys, new CreateIndexOptions { Name = legacyName, Unique = true }),
                cancellationToken: cancellationToken);
        }
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
            Password = PasswordHasher.Hash("password"),
            Email = "g.raba29@gmail.com",
            Role = "Admin"
        };

        await users.InsertOneAsync(adminUser, cancellationToken: cancellationToken);
        _logger.LogInformation("Seeded initial admin user '{UserName}' into MongoDB.", adminUser.UserName);
    }

    /// <summary>
    /// One-time, idempotent backfill: any Barber that predates the "every barber always gets a
    /// ShopId" guarantee (see BarberService.CreateAsync) is given its own BarberShop here, and
    /// their existing Appointments/Clients are updated to point at it. ShopId is the tenant
    /// boundary used to isolate each barber's data from every other barber's, so this must run
    /// before that isolation can be enforced safely. Runs on every startup but is a no-op once
    /// no Barber is missing a ShopId.
    /// </summary>
    /// <param name="cancellationToken">A token to monitor for cancellation requests.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    private async Task EnsureBarberShopIdsAsync(CancellationToken cancellationToken = default)
    {
        var barbers = _database.GetCollection<BarberEntity>("barbers");
        var missingShopFilter = Builders<BarberEntity>.Filter.Or(
            Builders<BarberEntity>.Filter.Eq(b => b.ShopId, null),
            Builders<BarberEntity>.Filter.Eq(b => b.ShopId, string.Empty));

        var barbersWithoutShop = await barbers.Find(missingShopFilter).ToListAsync(cancellationToken);
        if (barbersWithoutShop.Count == 0) return;

        var appointments = _database.GetCollection<Appointments>("appointments");
        var clients = _database.GetCollection<Client>("clients");

        foreach (var barber in barbersWithoutShop)
        {
            var shop = await _barberShopRepo.CreateAsync(new BarberShop
            {
                Name = string.IsNullOrWhiteSpace(barber.BarberShopName) ? barber.BarberName : barber.BarberShopName,
                Phone = barber.BarberShopPhone,
                Address = barber.Address,
                CreatedBy = barber.CreatedBy,
                UpdatedBy = barber.CreatedBy,
            });

            await barbers.UpdateOneAsync(
                Builders<BarberEntity>.Filter.Eq(b => b.Id, barber.Id),
                Builders<BarberEntity>.Update.Set(b => b.ShopId, shop.Id),
                cancellationToken: cancellationToken);

            var ownedByThisBarberWithNoShop = Builders<Appointments>.Filter.And(
                Builders<Appointments>.Filter.Eq(a => a.CreatedBy, barber.UserName),
                Builders<Appointments>.Filter.Or(
                    Builders<Appointments>.Filter.Eq(a => a.ShopId, null),
                    Builders<Appointments>.Filter.Eq(a => a.ShopId, string.Empty)));
            await appointments.UpdateManyAsync(
                ownedByThisBarberWithNoShop,
                Builders<Appointments>.Update.Set(a => a.ShopId, shop.Id),
                cancellationToken: cancellationToken);

            var clientsOwnedByThisBarberWithNoShop = Builders<Client>.Filter.And(
                Builders<Client>.Filter.Eq(c => c.CreatedBy, barber.UserName),
                Builders<Client>.Filter.Or(
                    Builders<Client>.Filter.Eq(c => c.ShopId, null),
                    Builders<Client>.Filter.Eq(c => c.ShopId, string.Empty)));
            await clients.UpdateManyAsync(
                clientsOwnedByThisBarberWithNoShop,
                Builders<Client>.Update.Set(c => c.ShopId, shop.Id),
                cancellationToken: cancellationToken);
        }

        _logger.LogInformation("Backfilled ShopId for {Count} barber(s) that were missing one.", barbersWithoutShop.Count);
    }
}
