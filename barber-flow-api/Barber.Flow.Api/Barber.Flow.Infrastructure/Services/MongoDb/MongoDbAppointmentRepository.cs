using Barber.Flow.Domain.Entities;
using Barber.Flow.Domain.Interfaces;
using MongoDB.Bson;
using MongoDB.Driver;

namespace Barber.Flow.Infrastructure.Services.MongoDb;

public sealed class MongoDbAppointmentRepository : IAppointmentRepository
{
    private readonly IMongoCollection<Appointments> _collection;
    private readonly IMongoCollection<BsonCounter> _countersCollection;

    public MongoDbAppointmentRepository(IMongoDatabase database)
    {
        _collection = database.GetCollection<Appointments>("appointments");
        _countersCollection = database.GetCollection<BsonCounter>("counters");
    }

    /// <inheritdoc/>
    public async Task<Appointments> CreateAsync(Appointments appointment, CancellationToken cancellation = default)
    {
        if (string.IsNullOrWhiteSpace(appointment.Id))
        {
            appointment.Id = await GenerateNextIdAsync(cancellation);
        }

        appointment.CreatedAt = DateTime.UtcNow;
        appointment.UpdatedAt = appointment.CreatedAt;
        await _collection.InsertOneAsync(appointment, cancellationToken: cancellation);
        return appointment;
    }

    /// <inheritdoc/>
    public async Task<Appointments?> UpdateAsync(string id, Appointments appointment, CancellationToken cancellation = default)
    {
        var update = Builders<Appointments>.Update
            .Set(a => a.ClientName, appointment.ClientName)
            .Set(a => a.Phone, appointment.Phone)
            .Set(a => a.ClientId, appointment.ClientId)
            .Set(a => a.Date, appointment.Date)
            .Set(a => a.Time, appointment.Time)
            .Set(a => a.Status, appointment.Status)
            .Set(a => a.CompletedAt, appointment.CompletedAt)
            .Set(a => a.PaymentMethodUsed, appointment.PaymentMethodUsed)
            .Set(a => a.ServiceName, appointment.ServiceName)
            .Set(a => a.ServicePrice, appointment.ServicePrice)
            .Set(a => a.Notes, appointment.Notes)
            .Set(a => a.ShopId, appointment.ShopId)
            .Set(a => a.UpdatedAt, DateTime.UtcNow)
            .Set(a => a.UpdatedBy, appointment.UpdatedBy);

        return await _collection.FindOneAndUpdateAsync(
            Builders<Appointments>.Filter.Eq(a => a.Id, id),
            update,
            new FindOneAndUpdateOptions<Appointments> { ReturnDocument = ReturnDocument.After },
            cancellation);
    }

    /// <inheritdoc/>
    public async Task<bool> DeleteAsync(string id, CancellationToken cancellation = default)
    {
        var result = await _collection.DeleteOneAsync(
            Builders<Appointments>.Filter.Eq(a => a.Id, id),
            cancellation);
        return result.DeletedCount > 0;
    }

    /// <inheritdoc/>
    public async Task<Appointments?> GetByIdAsync(string id, CancellationToken cancellation = default)
    {
        return await _collection
            .Find(Builders<Appointments>.Filter.Eq(a => a.Id, id))
            .FirstOrDefaultAsync(cancellation);
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<Appointments>> FindAsync(
        string? date = null,
        string? endDate = null,
        string? status = null,
        string? query = null,
        int? page = null,
        int? pageSize = null,
        string? shopId = null,
        string? createdBy = null,
        CancellationToken cancellation = default)
    {
        var filters = new List<FilterDefinition<Appointments>>();

        if (!string.IsNullOrWhiteSpace(date))
        {
            if (!string.IsNullOrWhiteSpace(endDate))
            {
                filters.Add(Builders<Appointments>.Filter.Gte(a => a.Date, date.Trim()));
                filters.Add(Builders<Appointments>.Filter.Lte(a => a.Date, endDate.Trim()));
            }
            else
            {
                filters.Add(Builders<Appointments>.Filter.Eq(a => a.Date, date.Trim()));
            }
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            filters.Add(Builders<Appointments>.Filter.Eq(a => a.Status, status.Trim()));
        }

        if (!string.IsNullOrWhiteSpace(query))
        {
            var regex = new BsonRegularExpression(System.Text.RegularExpressions.Regex.Escape(query.Trim()), "i");
            filters.Add(Builders<Appointments>.Filter.Or(
                Builders<Appointments>.Filter.Regex(a => a.ClientName, regex),
                Builders<Appointments>.Filter.Regex(a => a.Phone, regex)
            ));
        }

        if (!string.IsNullOrWhiteSpace(shopId))
        {
            filters.Add(Builders<Appointments>.Filter.Eq(a => a.ShopId, shopId));
        }

        if (!string.IsNullOrWhiteSpace(createdBy))
        {
            filters.Add(Builders<Appointments>.Filter.Eq(a => a.CreatedBy, createdBy));
        }

        var filter = filters.Count > 0
            ? Builders<Appointments>.Filter.And(filters)
            : Builders<Appointments>.Filter.Empty;

        var findCursor = _collection
            .Find(filter)
            .Sort(Builders<Appointments>.Sort.Ascending(a => a.Date).Ascending(a => a.Time));

        var ps = Math.Clamp(pageSize ?? 50, 1, 100);
        var pg = Math.Max(0, (page ?? 1) - 1);

        return await findCursor
            .Skip(pg * ps)
            .Limit(ps)
            .ToListAsync(cancellation);
    }

    /// <inheritdoc/>
    public async Task<Appointments?> MoveAsync(string id, string newDate, string? newTime = null, CancellationToken cancellation = default)
    {
        var update = Builders<Appointments>.Update
            .Set(a => a.Date, newDate)
            .Set(a => a.UpdatedAt, DateTime.UtcNow);

        if (!string.IsNullOrWhiteSpace(newTime))
        {
            update = update.Set(a => a.Time, newTime);
        }

        return await _collection.FindOneAndUpdateAsync(
            Builders<Appointments>.Filter.Eq(a => a.Id, id),
            update,
            new FindOneAndUpdateOptions<Appointments> { ReturnDocument = ReturnDocument.After },
            cancellation);
    }

    /// <inheritdoc/>
    public async Task<bool> HasConflictAsync(string date, string time, string? excludeId, CancellationToken cancellation = default)
    {
        var filters = new List<FilterDefinition<Appointments>>
        {
            Builders<Appointments>.Filter.Eq(a => a.Date, date),
            Builders<Appointments>.Filter.Eq(a => a.Time, time),
            Builders<Appointments>.Filter.Ne(a => a.Status, "cancelled"),
        };

        if (!string.IsNullOrWhiteSpace(excludeId))
        {
            filters.Add(Builders<Appointments>.Filter.Ne(a => a.Id, excludeId));
        }

        var filter = Builders<Appointments>.Filter.And(filters);
        return await _collection.Find(filter).AnyAsync(cancellation);
    }

    /// <inheritdoc/>
    public async Task<string> GetNextIdAsync(CancellationToken cancellation = default)
    {
        var filter = Builders<BsonCounter>.Filter.Eq(c => c.Id, "appointmentId");
        var counter = await _countersCollection.Find(filter).FirstOrDefaultAsync(cancellation);

        var nextValue = counter?.SequenceValue ?? 0;
        return $"APT-{nextValue:D4}";
    }

    private async Task<string> GenerateNextIdAsync(CancellationToken cancellation = default)
    {
        var filter = Builders<BsonCounter>.Filter.Eq(c => c.Id, "appointmentId");

        // First try to increment existing counter
        var update = Builders<BsonCounter>.Update.Inc(c => c.SequenceValue, 1);
        var options = new FindOneAndUpdateOptions<BsonCounter>
        {
            ReturnDocument = ReturnDocument.After 
        };

        var counter = await _countersCollection.FindOneAndUpdateAsync(filter, update, options, cancellation);

        // If counter didn't exist, create it with initial value 0
        if (counter == null)
        {
            counter = new BsonCounter { Id = "appointmentId", SequenceValue = 0 };
            try
            {
                await _countersCollection.InsertOneAsync(counter, cancellationToken: cancellation);
            }
            catch (MongoWriteException ex) when (ex.WriteError?.Category == ServerErrorCategory.DuplicateKey)
            {
                // Race condition: another thread created it, try increment again
                counter = await _countersCollection.FindOneAndUpdateAsync(filter, update, options, cancellation);
            }
        }

        return $"APT-{counter.SequenceValue:D4}";
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<Appointments>> GetClientHistoryAsync(
        string clientId,
        string createdBy,
        int page = 1,
        int pageSize = 20,
        CancellationToken cancellation = default)
    {
        var filter = Builders<Appointments>.Filter.And(
            Builders<Appointments>.Filter.Eq(a => a.ClientId, clientId),
            Builders<Appointments>.Filter.Eq(a => a.CreatedBy, createdBy)
        );

        return await _collection
            .Find(filter)
            .Sort(Builders<Appointments>.Sort.Descending(a => a.Date).Descending(a => a.Time))
            .Skip((page - 1) * pageSize)
            .Limit(pageSize)
            .ToListAsync(cancellation);
    }

    /// <inheritdoc/>
    public async Task<Appointments?> FindByPhoneAsync(
        string phone,
        string createdBy,
        CancellationToken cancellation = default)
    {
        var filter = Builders<Appointments>.Filter.And(
            Builders<Appointments>.Filter.Eq(a => a.Phone, phone),
            Builders<Appointments>.Filter.Eq(a => a.CreatedBy, createdBy)
        );

        return await _collection
            .Find(filter)
            .Sort(Builders<Appointments>.Sort.Descending(a => a.CreatedAt))
            .FirstOrDefaultAsync(cancellation);
    }

    private class BsonCounter
    {
        public string Id { get; set; } = string.Empty;
        public int SequenceValue { get; set; }
    }
}
