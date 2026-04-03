using Barber.Flow.Domain.Entities;

namespace Barber.Flow.Application.Services.Reports;

public interface IReportService
{
    Task<DailyReport> GetDailyReportAsync(DateOnly reportDate, CancellationToken cancellationToken = default);
}