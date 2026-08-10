using Barber.Flow.Domain.Entities;

namespace Barber.Flow.Application.Services.Reports;

public interface IReportService
{
    Task<DailyReport> GetDailyReportAsync(DateOnly reportDate, string? requestingUserName = null, CancellationToken cancellationToken = default);
}