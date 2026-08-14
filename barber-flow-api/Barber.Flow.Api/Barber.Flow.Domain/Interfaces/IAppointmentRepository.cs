namespace Barber.Flow.Domain.Interfaces;

public interface IAppointmentRepository
{
    /// <summary>
    /// Creates a new appointment in the database. If the appointment's Id is null or empty, a new unique Id will be generated.
    /// </summary>
    /// <param name="appointment">The appointment entity to be created.</param>
    /// <param name="cancellation">A token to monitor for cancellation requests.</param>
    /// <returns>The created appointment entity.</returns>
    Task<Entities.Appointments> CreateAsync(Entities.Appointments appointment, CancellationToken cancellation = default);

    /// <summary>
    /// Updates an existing appointment in the database.
    /// </summary>
    /// <param name="id">The unique identifier of the appointment to be updated.</param>
    /// <param name="appointment">The appointment entity with updated information.</param>
    /// <param name="cancellation">A token to monitor for cancellation requests.</param>
    /// <returns>The updated appointment entity, or null if the appointment does not exist.</returns>
    Task<Entities.Appointments?> UpdateAsync(string id, Entities.Appointments appointment, CancellationToken cancellation = default);
    
    /// <summary>
    /// Deletes an appointment from the database.
    /// </summary>
    /// <param name="id">The unique identifier of the appointment to be deleted.</param>
    /// <param name="cancellation">A token to monitor for cancellation requests.</param>
    /// <returns>True if the appointment was successfully deleted, false otherwise.</returns>
    Task<bool> DeleteAsync(string id, CancellationToken cancellation = default);

    /// <summary>
    /// Retrieves an appointment by its unique identifier.
    /// </summary>
    /// <param name="id">The unique identifier of the appointment.</param>
    /// <param name="cancellation">A token to monitor for cancellation requests.</param>
    /// <returns>The appointment entity, or null if not found.</returns>
    Task<Entities.Appointments?> GetByIdAsync(string id, CancellationToken cancellation = default);

    /// <summary>
    /// Finds appointments based on various criteria.
    /// </summary>
    /// <param name="date">The start date for the search range.</param>
    /// <param name="endDate">The end date for the search range.</param>
    /// <param name="status">The status of the appointments to search for.</param>
    /// <param name="query">A search query to filter appointments.</param>
    /// <param name="page">The page number for pagination.</param>
    /// <param name="pageSize">The number of appointments per page.</param>
    /// <param name="shopId">When provided, restricts results to appointments belonging to this shop.</param>
    /// <param name="cancellation">A token to monitor for cancellation requests.</param>
    /// <returns>A collection of appointments matching the search criteria.</returns>
    Task<IEnumerable<Entities.Appointments>> FindAsync(
        string? date = null,
        string? endDate = null,
        string? status = null,
        string? query = null,
        int? page = null,
        int? pageSize = null,
        string? shopId = null,
        CancellationToken cancellation = default);

    /// <summary>
    /// Moves an appointment to a new date and, optionally, a new time.
    /// </summary>
    /// <param name="id">The unique identifier of the appointment to be moved.</param>
    /// <param name="newDate">The new date for the appointment.</param>
    /// <param name="newTime">The new time for the appointment, or null to leave the time unchanged.</param>
    /// <param name="cancellation">A token to monitor for cancellation requests.</param>
    /// <returns>The updated appointment entity, or null if the appointment does not exist.</returns>
    Task<Entities.Appointments?> MoveAsync(string id, string newDate, string? newTime = null, CancellationToken cancellation = default);

    /// <summary>
    /// Checks whether a non-cancelled appointment already exists at the given date and time.
    /// </summary>
    /// <param name="date">The date to check.</param>
    /// <param name="time">The time to check.</param>
    /// <param name="excludeId">An appointment id to exclude from the check (e.g. the appointment being moved/updated).</param>
    /// <param name="cancellation">A token to monitor for cancellation requests.</param>
    /// <returns>True if a conflicting appointment exists, false otherwise.</returns>
    Task<bool> HasConflictAsync(string date, string time, string? excludeId, CancellationToken cancellation = default);

    /// <summary>
    /// Generates the next unique identifier for an appointment.
    /// </summary>
    /// <param name="cancellation">A token to monitor for cancellation requests.</param>
    /// <returns>The next unique identifier for an appointment.</returns>
    Task<string> GetNextIdAsync(CancellationToken cancellation = default);

    /// <summary>
    /// Retrieves the appointment history for a specific client.
    /// </summary>
    /// <param name="clientId">The unique identifier of the client.</param>
    /// <param name="createdBy">The identifier of the user who created the appointments.</param>
    /// <param name="page">The page number for pagination.</param>
    /// <param name="pageSize">The number of appointments per page.</param>
    /// <param name="cancellation">A token to monitor for cancellation requests.</param>
    /// <returns>A collection of appointments for the specified client.</returns>
    Task<IEnumerable<Entities.Appointments>> GetClientHistoryAsync(
        string clientId,
        string createdBy,
        int page = 1,
        int pageSize = 20,
        CancellationToken cancellation = default);

    /// <summary>
    /// Finds an appointment by the client's phone number.
    /// </summary>
    /// <param name="phone">The phone number of the client.</param>
    /// <param name="createdBy">The identifier of the user who created the appointment.</param>
    /// <param name="cancellation">A token to monitor for cancellation requests.</param>
    /// <returns>The appointment entity, or null if not found.</returns>
    Task<Entities.Appointments?> FindByPhoneAsync(
        string phone,
        string createdBy,
        CancellationToken cancellation = default);
}
