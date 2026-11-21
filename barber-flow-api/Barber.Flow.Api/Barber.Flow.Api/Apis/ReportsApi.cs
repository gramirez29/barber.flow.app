using Barber.Flow.Api.DTOs.Responses;
using Barber.Flow.Api.Extensions;
using Barber.Flow.Application.Services.Reports;
using Barber.Flow.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.JsonWebTokens;
using System.Security.Claims;

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

        api.MapGet("/weekly", GetWeeklyReportAsync)
            .WithName(nameof(GetWeeklyReportAsync))
            .WithTags(ReportTagName);

        api.MapGet("/monthly", GetMonthlyReportAsync)
            .WithName(nameof(GetMonthlyReportAsync))
            .WithTags(ReportTagName);

        return api;
    }

    // Week (Sunday to Saturday) containing `date`; without it, the current week.
    private static async Task<IResult> GetWeeklyReportAsync(
        [FromQuery] string? date,
        IReportService reportService,
        HttpContext httpContext,
        CancellationToken cancellationToken = default)
    {
        DateOnly? anchor = null;
        if (!string.IsNullOrWhiteSpace(date))
        {
            if (!DateOnly.TryParseExact(date, "yyyy-MM-dd", out var parsed))
            {
                return TypedResults.BadRequest(new { message = "The date query parameter must use yyyy-MM-dd format." });
            }

            anchor = parsed;
        }

        var report = await reportService.GetWeeklyReportAsync(anchor, GetUserName(httpContext), cancellationToken);
        return TypedResults.Ok(Map(report));
    }

    // Calendar month `month` (yyyy-MM); without it, the current month.
    private static async Task<IResult> GetMonthlyReportAsync(
        [FromQuery] string? month,
        IReportService reportService,
        HttpContext httpContext,
        CancellationToken cancellationToken = default)
    {
        DateOnly? anyDayInMonth = null;
        if (!string.IsNullOrWhiteSpace(month))
        {
            if (!DateOnly.TryParseExact($"{month}-01", "yyyy-MM-dd", out var parsed))
            {
                return TypedResults.BadRequest(new { message = "The month query parameter must use yyyy-MM format." });
            }

            anyDayInMonth = parsed;
        }

        var report = await reportService.GetMonthlyReportAsync(anyDayInMonth, GetUserName(httpContext), cancellationToken);
        return TypedResults.Ok(Map(report));
    }

    // Reads the unambiguous "username" claim (sub and nameid both remap to NameIdentifier, so
    // FindFirst(NameIdentifier) depends on claim order) and falls back like the daily report does.
    private static string? GetUserName(HttpContext httpContext) =>
        httpContext.User.GetUserName()
        ?? httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? httpContext.User.Identity?.Name;

    private static PeriodReportResponse Map(PeriodReport report) =>
        new(
            report.PeriodType,
            report.From,
            report.To,
            report.CountedDays,
            report.TotalCustomersServed,
            report.GrossRevenue,
            report.CommissionAmount,
            report.FixedDailyExpense,
            report.FixedExpenseTotal,
            report.NetProfit,
            report.PaymentMethodBreakdown.Select(item => new PaymentMethodBreakdownResponse(
                item.PaymentMethod,
                item.Label,
                item.Total,
                item.AppointmentCount)),
            report.Days.Select(day => new PeriodReportDayResponse(
                day.Date,
                day.TotalCustomersServed,
                day.GrossRevenue,
                day.CommissionAmount,
                day.FixedExpense,
                day.NetProfit)),
            report.GeneratedAt);

    private static async Task<IResult> GetDailyReportAsync(
        [FromQuery] string? date,
        IReportService reportService,
        HttpContext httpContext,
        CancellationToken cancellationToken = default)
    {
        var reportDate = ParseReportDate(date);

        if (reportDate is null)
        {
            return TypedResults.BadRequest(new { message = "The date query parameter must use yyyy-MM-dd format." });
        }

        var userId = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? httpContext.User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? httpContext.User.FindFirst("username")?.Value
            ?? httpContext.User.Identity?.Name;

        var report = await reportService.GetDailyReportAsync(reportDate.Value, userId, cancellationToken);
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