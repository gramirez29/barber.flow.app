using Barber.Flow.Domain.Entities;
using Barber.Flow.Domain.Interfaces;

namespace Barber.Flow.Infrastructure.Services.InMemory;

public class InMemoryReportRepository : IReportRepository
{
    public Task<DailyReport> GetDailyReportAsync(DateOnly reportDate, CancellationToken cancellationToken = default)
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