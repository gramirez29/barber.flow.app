using Barber.Flow.Domain.Entities;

namespace Barber.Flow.Domain.Interfaces;

public interface IReportRepository
{
    Task<DailyReport> GetDailyReportAsync(DateOnly reportDate, string? requestingUserName = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Builds the weekly or monthly report for the inclusive range <paramref name="from"/>..<paramref name="to"/>.
    /// <paramref name="today"/> (Costa Rica date) is passed in so the repository doesn't depend on the clock:
    /// the fixed daily expense is only charged for days up to today.
    /// </summary>
    Task<PeriodReport> GetPeriodReportAsync(string periodType, DateOnly from, DateOnly to, DateOnly today, string? requestingUserName = null, CancellationToken cancellationToken = default);
}
