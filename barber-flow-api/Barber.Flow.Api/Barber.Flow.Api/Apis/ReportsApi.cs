using Barber.Flow.Api.DTOs.Responses;
using Barber.Flow.Application.Services.Reports;
using Barber.Flow.Domain.Entities;
using Microsoft.AspNetCore.Mvc;

namespace Barber.Flow.Api.Apis;

public static class ReportsApi
{
    private static readonly string ReportTagName = "Reports";

    public static RouteGroupBuilder MapReportsApi(this IEndpointRouteBuilder app)
    {
        var api = app.MapGroup("api/reports")
            .RequireAuthorization();

        api.MapGet("/daily", GetDailyReportAsync)
            .WithName(nameof(GetDailyReportAsync))
            .WithTags(ReportTagName);

        return api;
    }

    private static async Task<IResult> GetDailyReportAsync(
        [FromQuery] string? date,
        IReportService reportService,
        CancellationToken cancellationToken = default)
    {
        var reportDate = ParseReportDate(date);

        if (reportDate is null)
        {
            return TypedResults.BadRequest(new { message = "The date query parameter must use yyyy-MM-dd format." });
        }

        var report = await reportService.GetDailyReportAsync(reportDate.Value, cancellationToken);
        return TypedResults.Ok(Map(report));
    }

    private static DateOnly? ParseReportDate(string? date)
    {
        if (string.IsNullOrWhiteSpace(date))
        {
            return DateOnly.FromDateTime(DateTime.Today);
        }

        return DateOnly.TryParse(date, out var parsedDate) ? parsedDate : null;
    }

    private static DailyReportResponse Map(DailyReport report) =>
        new(
            report.ReportDate,
            report.TotalCustomersServed,
            report.GrossRevenue,
            report.NetProfit,
            report.CommissionAmount,
            report.FixedDailyExpense,
            report.PaymentMethodBreakdown.Select(item => new PaymentMethodBreakdownResponse(
                item.PaymentMethod,
                item.Label,
                item.Total,
                item.AppointmentCount)),
            report.CompletedAppointments.Select(item => new CompletedAppointmentReportItemResponse(
                item.Id,
                item.ClientName,
                item.ServiceName,
                item.Time,
                item.ServicePrice,
                item.PaymentMethodUsed)),
            report.GeneratedAt);
}