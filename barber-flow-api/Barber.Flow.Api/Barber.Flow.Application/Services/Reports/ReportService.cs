using Barber.Flow.Domain.Entities;
using Barber.Flow.Domain.Interfaces;
using Barber.Flow.Domain.ValueObjects;

namespace Barber.Flow.Application.Services.Reports;

public class ReportService(IReportRepository reportRepository, TimeProvider timeProvider) : IReportService
{
    private readonly IReportRepository _reportRepository = reportRepository;
    private readonly TimeProvider _timeProvider = timeProvider;

    public Task<DailyReport> GetDailyReportAsync(DateOnly reportDate, string? requestingUserName = null, CancellationToken cancellationToken = default)
    {
        return _reportRepository.GetDailyReportAsync(reportDate, requestingUserName, cancellationToken);
    }

    public Task<PeriodReport> GetWeeklyReportAsync(DateOnly? anchor = null, string? requestingUserName = null, CancellationToken cancellationToken = default)
    {
        var today = ReportPeriods.TodayInCostaRica(_timeProvider.GetUtcNow());
        var (from, to) = ReportPeriods.GetWeek(anchor ?? today);
        return _reportRepository.GetPeriodReportAsync(PeriodReport.Weekly, from, to, today, requestingUserName, cancellationToken);
    }

    public Task<PeriodReport> GetMonthlyReportAsync(DateOnly? anyDayInMonth = null, string? requestingUserName = null, CancellationToken cancellationToken = default)
    {
        var today = ReportPeriods.TodayInCostaRica(_timeProvider.GetUtcNow());
        var (from, to) = ReportPeriods.GetMonth(anyDayInMonth ?? today);
        return _reportRepository.GetPeriodReportAsync(PeriodReport.Monthly, from, to, today, requestingUserName, cancellationToken);
    }
}
