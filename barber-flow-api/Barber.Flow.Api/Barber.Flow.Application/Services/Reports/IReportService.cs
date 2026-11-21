using Barber.Flow.Domain.Entities;

namespace Barber.Flow.Application.Services.Reports;

public interface IReportService
{
    Task<DailyReport> GetDailyReportAsync(DateOnly reportDate, string? requestingUserName = null, CancellationToken cancellationToken = default);

    /// <summary>The week (Sunday to Saturday) containing <paramref name="anchor"/>; null means the current week.</summary>
    Task<PeriodReport> GetWeeklyReportAsync(DateOnly? anchor = null, string? requestingUserName = null, CancellationToken cancellationToken = default);

    /// <summary>The calendar month containing <paramref name="anyDayInMonth"/>; null means the current month.</summary>
    Task<PeriodReport> GetMonthlyReportAsync(DateOnly? anyDayInMonth = null, string? requestingUserName = null, CancellationToken cancellationToken = default);
}
