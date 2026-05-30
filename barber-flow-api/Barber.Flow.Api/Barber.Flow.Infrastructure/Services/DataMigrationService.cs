using Barber.Flow.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace Barber.Flow.Infrastructure.Services;

public interface IDataMigrationService
{
    Task MigrateClientLinksAsync(CancellationToken cancellationToken = default);
}

public class DataMigrationService : IDataMigrationService
{
    private readonly IAppointmentRepository _appointmentRepository;
    private readonly IClientRepository _clientRepository;
    private readonly ILogger<DataMigrationService> _logger;

    public DataMigrationService(
        IAppointmentRepository appointmentRepository,
        IClientRepository clientRepository,
        ILogger<DataMigrationService> logger)
    {
        _appointmentRepository = appointmentRepository;
        _clientRepository = clientRepository;
        _logger = logger;
    }

    public async Task MigrateClientLinksAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Starting client link migration...");

        try
        {
            // Get all appointments without ClientId
            var allAppointments = await _appointmentRepository.FindAsync(
                page: 1,
                pageSize: 10000,
                cancellation: cancellationToken);

            var appointmentsToUpdate = allAppointments
                .Where(a => string.IsNullOrEmpty(a.ClientId) && !string.IsNullOrEmpty(a.Phone))
                .ToList();

            _logger.LogInformation("Found {Count} appointments to migrate", appointmentsToUpdate.Count);

            var migratedCount = 0;
            var failedCount = 0;

            foreach (var appointment in appointmentsToUpdate)
            {
                try
                {
                    // Try to find matching client by phone and CreatedBy
                    var clients = await _clientRepository.FindAsync(
                        query: appointment.Phone,
                        page: 1,
                        pageSize: 1,
                        cancellation: cancellationToken);

                    var matchingClient = clients.FirstOrDefault(c => c.Phone == appointment.Phone);

                    if (matchingClient != null)
                    {
                        appointment.ClientId = matchingClient.Id;
                        await _appointmentRepository.UpdateAsync(appointment.Id, appointment, cancellationToken);
                        migratedCount++;
                        _logger.LogDebug("Linked appointment {AppointmentId} to client {ClientId}", 
                            appointment.Id, matchingClient.Id);
                    }
                }
                catch (Exception ex)
                {
                    failedCount++;
                    _logger.LogWarning(ex, "Failed to migrate appointment {AppointmentId}", appointment.Id);
                }
            }

            _logger.LogInformation(
                "Migration completed. Migrated: {Migrated}, Failed: {Failed}", 
                migratedCount, 
                failedCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during client link migration");
            throw;
        }
    }
}
