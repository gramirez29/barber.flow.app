using Barber.Flow.Domain.Entities;
using Barber.Flow.Domain.Interfaces;

namespace Barber.Flow.Infrastructure.Services.InMemory;

public class InMemoryReportRepository : IReportRepository
{
    public Task<DailyReport> GetDailyReportAsync(DateOnly reportDate, string? requestingUserName = null, CancellationToken cancellationToken = default)
    {
        var daySeed = Math.Abs(reportDate.DayNumber % 7);
        var baseHour = 9;
        var completedAppointments = new List<CompletedAppointmentReportItem>
        {
            CreateAppointment(reportDate, 1, "Juan Perez", "Classic Haircut", baseHour, 12500m + (daySeed * 200)),
            CreateAppointment(reportDate, 2, "Maria Gomez", "Haircut + Beard", baseHour + 1, 18000m + (daySeed * 150)),
            CreateAppointment(reportDate, 3, "Carlos Lopez", "Premium Fade", baseHour + 3, 15000m + (daySeed * 180)),
            CreateAppointment(reportDate, 4, "Andrea Soto", "Hair Wash & Style", baseHour + 5, 11000m + (daySeed * 120)),
        };

        var paymentBreakdown = new[]
        {
            BuildBreakdown("cash", "Cash", completedAppointments.Where(item => item.PaymentMethodUsed == "cash")),
            BuildBreakdown("card", "Credit/Debit Card", completedAppointments.Where(item => item.PaymentMethodUsed == "card")),
            BuildBreakdown("transfer", "Digital Transfer", completedAppointments.Where(item => item.PaymentMethodUsed == "transfer")),
        };

        var grossRevenue = completedAppointments.Sum(item => item.ServicePrice);
        var commissionAmount = Math.Round(grossRevenue * 0.40m, 2, MidpointRounding.AwayFromZero);
        var fixedDailyExpense = 12000m;
        var netProfit = grossRevenue - commissionAmount - fixedDailyExpense;

        var report = new DailyReport
        {
            CommissionAmount = commissionAmount,
            CompletedAppointments = completedAppointments,
            FixedDailyExpense = fixedDailyExpense,
            GeneratedAt = DateTime.UtcNow,
            GrossRevenue = grossRevenue,
            NetProfit = netProfit,
            PaymentMethodBreakdown = paymentBreakdown,
            ReportDate = reportDate,
            TotalCustomersServed = completedAppointments.Count,
        };

        return Task.FromResult(report);
    }

    // Development/test double: builds the period out of the fake daily reports above, applying the same
    // rules as the Mongo implementation (fixed expense only up to today).
    public async Task<PeriodReport> GetPeriodReportAsync(
        string periodType,
        DateOnly from,
        DateOnly to,
        DateOnly today,
        string? requestingUserName = null,
        CancellationToken cancellationToken = default)
    {
        var dailyReports = new List<DailyReport>();
        for (var date = from; date <= to; date = date.AddDays(1))
        {
            dailyReports.Add(await GetDailyReportAsync(date, requestingUserName, cancellationToken));
        }

        var days = dailyReports
            .Select(daily =>
            {
                var expense = daily.ReportDate <= today ? daily.FixedDailyExpense : 0m;
                return new PeriodReportDay
                {
                    Date = daily.ReportDate,
                    TotalCustomersServed = daily.TotalCustomersServed,
                    GrossRevenue = daily.GrossRevenue,
                    CommissionAmount = daily.CommissionAmount,
                    FixedExpense = expense,
                    NetProfit = daily.GrossRevenue - daily.CommissionAmount - expense,
                };
            })
            .ToList();

        var breakdown = dailyReports
            .SelectMany(daily => daily.PaymentMethodBreakdown)
            .GroupBy(item => (item.PaymentMethod, item.Label))
            .Select(group => new PaymentMethodBreakdown
            {
                PaymentMethod = group.Key.PaymentMethod,
                Label = group.Key.Label,
                Total = group.Sum(item => item.Total),
                AppointmentCount = group.Sum(item => item.AppointmentCount),
            })
            .ToList();

        var gross = days.Sum(day => day.GrossRevenue);
        var commission = days.Sum(day => day.CommissionAmount);
        var expenseTotal = days.Sum(day => day.FixedExpense);

        return new PeriodReport
        {
            PeriodType = periodType,
            From = from,
            To = to,
            CountedDays = days.Count(day => day.Date <= today),
            TotalCustomersServed = days.Sum(day => day.TotalCustomersServed),
            GrossRevenue = gross,
            CommissionAmount = commission,
            FixedDailyExpense = dailyReports.FirstOrDefault()?.FixedDailyExpense ?? 0m,
            FixedExpenseTotal = expenseTotal,
            NetProfit = gross - commission - expenseTotal,
            PaymentMethodBreakdown = breakdown,
            Days = days,
            GeneratedAt = DateTime.UtcNow,
        };
    }

    private static CompletedAppointmentReportItem CreateAppointment(
        DateOnly reportDate,
        int index,
        string clientName,
        string serviceName,
        int hour,
        decimal servicePrice)
    {
        var paymentMethod = (index % 3) switch
        {
            0 => "transfer",
            1 => "cash",
            _ => "card",
        };

        return new CompletedAppointmentReportItem
        {
            ClientName = clientName,
            Id = $"report-{reportDate:yyyyMMdd}-{index}",
            PaymentMethodUsed = paymentMethod,
            ServiceName = serviceName,
            ServicePrice = servicePrice,
            Time = $"{hour:00}:00",
        };
    }

    private static PaymentMethodBreakdown BuildBreakdown(
        string paymentMethod,
        string label,
        IEnumerable<CompletedAppointmentReportItem> items)
    {
        var materializedItems = items.ToArray();

        return new PaymentMethodBreakdown
        {
            AppointmentCount = materializedItems.Length,
            Label = label,
            PaymentMethod = paymentMethod,
            Total = materializedItems.Sum(item => item.ServicePrice),
        };
    }
}