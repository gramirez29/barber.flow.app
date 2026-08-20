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

        var paymentMethodBreakdown = PaymentMethods
            .Select(method =>
            {
                var itemsForMethod = reportItems.Where(item => item.PaymentMethodUsed == method.PaymentMethod).ToArray();
                return new PaymentMethodBreakdown
                {
                    PaymentMethod = method.PaymentMethod,
                    Label = method.Label,
                    Total = itemsForMethod.Sum(item => item.ServicePrice),
                    AppointmentCount = itemsForMethod.Length,
                };
            })
            .ToList();

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
