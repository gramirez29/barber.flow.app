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

    public async Task<Appointments> CreateAsync(Appointments appointment, CancellationToken cancellation = default)
    {
        if (string.IsNullOrWhiteSpace(appointment.Id))
            appointment.Id = await GetNextIdAsync(cancellation);

        appointment.CreatedAt = DateTime.UtcNow;
        appointment.UpdatedAt = appointment.CreatedAt;
        await _collection.InsertOneAsync(appointment, cancellationToken: cancellation);
        return appointment;
    }

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

    public async Task<bool> DeleteAsync(string id, CancellationToken cancellation = default)
    {
        var result = await _collection.DeleteOneAsync(
            Builders<Appointments>.Filter.Eq(a => a.Id, id),
            cancellation);
        return result.DeletedCount > 0;
    }

    public async Task<Appointments?> GetByIdAsync(string id, CancellationToken cancellation = default)
    {
        return await _collection
            .Find(Builders<Appointments>.Filter.Eq(a => a.Id, id))
            .FirstOrDefaultAsync(cancellation);
    }

    public async Task<IEnumerable<Appointments>> FindAsync(
        string? date = null,
        string? endDate = null,
        string? status = null,
        string? query = null,
        int? page = null,
        int? pageSize = null,
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
            var regex = new BsonRegularExpression(query.Trim(), "i");
            filters.Add(Builders<Appointments>.Filter.Or(
                Builders<Appointments>.Filter.Regex(a => a.ClientName, regex),
                Builders<Appointments>.Filter.Regex(a => a.Phone, regex)
            ));
        }

        var filter = filters.Count > 0
            ? Builders<Appointments>.Filter.And(filters)
            : Builders<Appointments>.Filter.Empty;

        var findCursor = _collection
            .Find(filter)
            .Sort(Builders<Appointments>.Sort.Ascending(a => a.Date).Ascending(a => a.Time));

        var ps = pageSize ?? 50;
        var pg = (page ?? 1) - 1;

        return await findCursor
            .Skip(pg * ps)
            .Limit(ps)
            .ToListAsync(cancellation);
    }

    public async Task<Appointments?> MoveAsync(string id, string newDate, CancellationToken cancellation = default)
    {
        var update = Builders<Appointments>.Update
            .Set(a => a.Date, newDate)
            .Set(a => a.UpdatedAt, DateTime.UtcNow);

        return await _collection.FindOneAndUpdateAsync(
            Builders<Appointments>.Filter.Eq(a => a.Id, id),
            update,
            new FindOneAndUpdateOptions<Appointments> { ReturnDocument = ReturnDocument.After },
            cancellation);
    }

    public async Task<string> GetNextIdAsync(CancellationToken cancellation = default)
    {
        var filter = Builders<BsonCounter>.Filter.Eq(c => c.Id, "appointmentId");
        var update = Builders<BsonCounter>.Update.Inc(c => c.SequenceValue, 1);
        var options = new FindOneAndUpdateOptions<BsonCounter>
        {
            IsUpsert = true,
            ReturnDocument = ReturnDocument.After
        };

        var counter = await _countersCollection.FindOneAndUpdateAsync(filter, update, options, cancellation);
        return $"APT-{counter.SequenceValue:D4}";
    }

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
