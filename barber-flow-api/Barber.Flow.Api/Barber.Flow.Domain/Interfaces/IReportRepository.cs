using Barber.Flow.Domain.Entities;

namespace Barber.Flow.Domain.Interfaces;

public interface IReportRepository
{
    Task<DailyReport> GetDailyReportAsync(DateOnly reportDate, CancellationToken cancellationToken = default);
}