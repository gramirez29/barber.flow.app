using Barber.Flow.Domain.Entities;
using Barber.Flow.Domain.Interfaces;

namespace Barber.Flow.Application.Services.Reports;

public class ReportService(IReportRepository reportRepository) : IReportService
{
    private readonly IReportRepository _reportRepository = reportRepository;

    public Task<DailyReport> GetDailyReportAsync(DateOnly reportDate, string? requestingUserName = null, CancellationToken cancellationToken = default)
    {
        return _reportRepository.GetDailyReportAsync(reportDate, requestingUserName, cancellationToken);
    }
}