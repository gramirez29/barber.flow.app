using Barber.Flow.Domain.Entities;
using Barber.Flow.Domain.Interfaces;

namespace Barber.Flow.Infrastructure.Services.MongoDb;

public sealed class MongoDbReportRepository : IReportRepository
{
    // Fallback used when the requesting user has no linked Barber account yet
    // (e.g. the shared 'admin' account, or a Barber without Settings configured).
    // Matches mobile's DEFAULT_REPORT_CALCULATION_SETTINGS.
    private const decimal DefaultCommissionPercentage = 40m;
    private const decimal DefaultFixedDailyExpense = 0m;

    private static readonly (string PaymentMethod, string Label)[] PaymentMethods =
    [
        ("cash", "Efectivo"),
        ("sinpeMovil", "SINPE Móvil"),
        ("transfer", "Transferencia"),
        ("none", "No especificado"),
    ];

    private readonly IAppointmentRepository _appointmentRepository;
    private readonly IBarberRepository _barberRepository;

    public MongoDbReportRepository(IAppointmentRepository appointmentRepository, IBarberRepository barberRepository)
    {
        _appointmentRepository = appointmentRepository;
        _barberRepository = barberRepository;
    }

    // Normalizes payment methods predating the camelCase migration (e.g. 'sinpe_movil')
    // and buckets anything null/empty/unrecognized under 'none' so the breakdown always
    // reconciles with GrossRevenue instead of silently dropping revenue from the totals.
    private static string NormalizePaymentMethod(string? value) => value switch
    {
        "sinpe_movil" => "sinpeMovil",
        "cash" or "sinpeMovil" or "transfer" => value,
        _ => "none",
    };

    // One entry per payment method, always all of them, so the breakdown reconciles with the gross revenue.
    private static List<PaymentMethodBreakdown> BuildPaymentBreakdown(IReadOnlyCollection<(string PaymentMethod, decimal Price)> sales) =>
        PaymentMethods
            .Select(method =>
            {
                var salesForMethod = sales.Where(sale => sale.PaymentMethod == method.PaymentMethod).ToArray();
                return new PaymentMethodBreakdown
                {
                    PaymentMethod = method.PaymentMethod,
                    Label = method.Label,
                    Total = salesForMethod.Sum(sale => sale.Price),
                    AppointmentCount = salesForMethod.Length,
                };
            })
            .ToList();

    public async Task<PeriodReport> GetPeriodReportAsync(
        string periodType,
        DateOnly from,
        DateOnly to,
        DateOnly today,
        string? requestingUserName = null,
        CancellationToken cancellationToken = default)
    {
        var barber = string.IsNullOrWhiteSpace(requestingUserName)
            ? null
            : await _barberRepository.GetByUserNameAsync(requestingUserName, cancellationToken);

        // Same scoping and defaults as the daily report: a linked barber only sees their own
        // appointments and uses their own settings; the admin (no linked Barber) sees everything.
        // The search is not paginated when it has a date range, so the whole period comes back.
        var completedAppointments = (await _appointmentRepository.FindAsync(
            date: from.ToString("yyyy-MM-dd"),
            endDate: to.ToString("yyyy-MM-dd"),
            status: "completed",
            createdBy: barber != null ? requestingUserName : null,
            cancellation: cancellationToken)).ToList();

        var commissionPercentage = barber?.Settings?.CommissionPercentage ?? DefaultCommissionPercentage;
        var fixedDailyExpense = barber?.Settings?.FixedDailyExpense ?? DefaultFixedDailyExpense;

        var salesByDay = completedAppointments
            .Select(appointment => (
                Date: DateOnly.TryParseExact(appointment.Date, "yyyy-MM-dd", out var parsed) ? parsed : (DateOnly?)null,
                Price: appointment.ServicePrice ?? 0m,
                Method: NormalizePaymentMethod(appointment.PaymentMethodUsed)))
            .Where(sale => sale.Date.HasValue)
            .GroupBy(sale => sale.Date!.Value)
            .ToDictionary(group => group.Key, group => group.ToList());

        var days = new List<PeriodReportDay>();
        for (var date = from; date <= to; date = date.AddDays(1))
        {
            salesByDay.TryGetValue(date, out var sales);
            var dayGross = sales?.Sum(sale => sale.Price) ?? 0m;

            // Rounded per day, exactly like the daily report, so the period total always equals the
            // sum of its days to the cent.
            var dayCommission = Math.Round(dayGross * (commissionPercentage / 100m), 2, MidpointRounding.AwayFromZero);
            var dayExpense = date <= today ? fixedDailyExpense : 0m;

            days.Add(new PeriodReportDay
            {
                Date = date,
                TotalCustomersServed = sales?.Count ?? 0,
                GrossRevenue = dayGross,
                CommissionAmount = dayCommission,
                FixedExpense = dayExpense,
                NetProfit = dayGross - dayCommission - dayExpense,
            });
        }

        var allSales = salesByDay.Values.SelectMany(daySales => daySales).ToList();
        var grossRevenue = days.Sum(day => day.GrossRevenue);
        var commissionAmount = days.Sum(day => day.CommissionAmount);
        var fixedExpenseTotal = days.Sum(day => day.FixedExpense);

        return new PeriodReport
        {
            PeriodType = periodType,
            From = from,
            To = to,
            CountedDays = days.Count(day => day.Date <= today),
            TotalCustomersServed = allSales.Count,
            GrossRevenue = grossRevenue,
            CommissionAmount = commissionAmount,
            FixedDailyExpense = fixedDailyExpense,
            FixedExpenseTotal = fixedExpenseTotal,
            NetProfit = grossRevenue - commissionAmount - fixedExpenseTotal,
            PaymentMethodBreakdown = BuildPaymentBreakdown(allSales.Select(sale => (sale.Method, sale.Price)).ToList()),
            Days = days,
            GeneratedAt = DateTime.UtcNow,
        };
    }

    public async Task<DailyReport> GetDailyReportAsync(DateOnly reportDate, string? requestingUserName = null, CancellationToken cancellationToken = default)
    {
        var dateKey = reportDate.ToString("yyyy-MM-dd");

        var barber = string.IsNullOrWhiteSpace(requestingUserName)
            ? null
            : await _barberRepository.GetByUserNameAsync(requestingUserName, cancellationToken);

        // Scope the report to the requesting barber (CreatedBy is the actual per-barber
        // ownership boundary, same as Appointments/Clients search — not ShopId, which is
        // informational only) — without it, one barber's daily report would silently
        // include every other barber's revenue. A missing Barber link (the shared admin
        // account) intentionally falls through to "no filter", matching
        // AppointmentsApi/ClientsApi's admin bypass.
        var completedAppointments = (await _appointmentRepository.FindAsync(
            date: dateKey,
            endDate: dateKey,
            status: "completed",
            createdBy: barber != null ? requestingUserName : null,
            cancellation: cancellationToken)).ToList();

        var commissionPercentage = barber?.Settings?.CommissionPercentage ?? DefaultCommissionPercentage;
        var fixedDailyExpense = barber?.Settings?.FixedDailyExpense ?? DefaultFixedDailyExpense;

        var reportItems = completedAppointments
            .Select(appointment => new CompletedAppointmentReportItem
            {
                Id = appointment.Id,
                ClientName = appointment.ClientName,
                ServiceName = appointment.ServiceName,
                Time = appointment.Time,
                ServicePrice = appointment.ServicePrice ?? 0m,
                PaymentMethodUsed = NormalizePaymentMethod(appointment.PaymentMethodUsed),
            })
            .OrderBy(item => item.Time)
            .ToList();

        var paymentMethodBreakdown = BuildPaymentBreakdown(
            reportItems.Select(item => (item.PaymentMethodUsed, item.ServicePrice)).ToList());

        var grossRevenue = reportItems.Sum(item => item.ServicePrice);
        var commissionAmount = Math.Round(grossRevenue * (commissionPercentage / 100m), 2, MidpointRounding.AwayFromZero);
        var netProfit = grossRevenue - commissionAmount - fixedDailyExpense;

        return new DailyReport
        {
            ReportDate = reportDate,
            TotalCustomersServed = reportItems.Count,
            GrossRevenue = grossRevenue,
            NetProfit = netProfit,
            CommissionAmount = commissionAmount,
            FixedDailyExpense = fixedDailyExpense,
            PaymentMethodBreakdown = paymentMethodBreakdown,
            CompletedAppointments = reportItems,
            GeneratedAt = DateTime.UtcNow,
        };
    }
}
