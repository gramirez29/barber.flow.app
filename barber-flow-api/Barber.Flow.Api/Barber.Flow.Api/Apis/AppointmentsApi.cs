using Barber.Flow.Api.DTOs.Requests;
using Barber.Flow.Api.DTOs.Responses;
using Barber.Flow.Api.Extensions;
using Barber.Flow.Application.Services.Appointments;
using Barber.Flow.Domain.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Barber.Flow.Api.Apis;

public static class AppointmentsApi
{
    private static readonly string AppointmentTag = "Appointments";

    public static RouteGroupBuilder MapAppointmentsApi(this IEndpointRouteBuilder app)
    {
        var api = app.MapGroup("api/appointments")
            .RequireAuthorization();

        api.MapPost("/create", CreateAppointmentAsync)
            .WithName(nameof(CreateAppointmentAsync))
            .WithTags(AppointmentTag);

        api.MapPut("/update/{id}", UpdateAppointmentAsync)
            .WithName(nameof(UpdateAppointmentAsync))
            .WithTags(AppointmentTag);

        api.MapPatch("/move/{id}", MoveAppointmentAsync)
            .WithName(nameof(MoveAppointmentAsync))
            .WithTags(AppointmentTag);

        api.MapGet("/search", FindAppointmentsAsync)
            .WithName(nameof(FindAppointmentsAsync))
            .WithTags(AppointmentTag);

        api.MapGet("/getById/{id}", GetAppointmentAsync)
            .WithName(nameof(GetAppointmentAsync))
            .WithTags(AppointmentTag);

        api.MapDelete("/delete/{id}", DeleteAppointmentAsync)
            .WithName(nameof(DeleteAppointmentAsync))
            .WithTags(AppointmentTag);

        api.MapGet("/nextAppointmentId", NextAppointmentIdAsync)
            .WithName(nameof(NextAppointmentIdAsync))
            .WithTags(AppointmentTag);

        return api;
    }

    private static async Task<IResult> CreateAppointmentAsync(
        AppointmentRequest request,
        IAppointmentService appointmentService,
        HttpContext httpContext,
        CancellationToken cancellationToken = default)
    {
        var userId = httpContext.User.GetUserName() ?? string.Empty;

        var appointment = new Domain.Entities.Appointments
        {
            ClientName = request.ClientName,
            Phone = request.Phone,
            Date = request.Date,
            Time = request.Time,
            Status = request.Status,
            CompletedAt = request.CompletedAt,
            PaymentMethodUsed = request.PaymentMethodUsed,
            ServiceName = request.ServiceName,
            ServicePrice = request.ServicePrice,
            Notes = request.Notes,
            CreatedBy = userId,
            UpdatedBy = userId
        };

        try
        {
            var created = await appointmentService.CreateAsync(appointment, cancellationToken);
            return TypedResults.Ok(Map(created));
        }
        catch (AppointmentSchedulingException ex)
        {
            return TypedResults.BadRequest(new { message = ex.Message });
        }
    }

    private static async Task<IResult> UpdateAppointmentAsync(
        string id,
        AppointmentRequest request,
        IAppointmentService appointmentService,
        HttpContext httpContext,
        CancellationToken cancellationToken = default)
    {
        var existing = await appointmentService.GetByIdAsync(id, cancellationToken);
        if (existing == null) return TypedResults.NotFound();

        var caller = ResolveCaller(httpContext);
        if (!CanAccess(caller, existing.CreatedBy)) return TypedResults.NotFound();

        var userId = httpContext.User.GetUserName() ?? string.Empty;

        var appointment = new Domain.Entities.Appointments
        {
            ClientName = request.ClientName,
            Phone = request.Phone,
            Date = request.Date,
            Time = request.Time,
            Status = request.Status,
            CompletedAt = request.CompletedAt,
            PaymentMethodUsed = request.PaymentMethodUsed,
            ServiceName = request.ServiceName,
            ServicePrice = request.ServicePrice,
            Notes = request.Notes,
            UpdatedBy = userId
        };

        try
        {
            var updated = await appointmentService.UpdateAsync(id, appointment, cancellationToken);
            if (updated == null) return TypedResults.NotFound();

            return TypedResults.Ok(Map(updated));
        }
        catch (AppointmentSchedulingException ex)
        {
            return TypedResults.BadRequest(new { message = ex.Message });
        }
    }

    private static async Task<IResult> MoveAppointmentAsync(
        string id,
        MoveAppointmentRequest request,
        IAppointmentService appointmentService,
        HttpContext httpContext,
        CancellationToken cancellationToken = default)
    {
        var existing = await appointmentService.GetByIdAsync(id, cancellationToken);
        if (existing == null) return TypedResults.NotFound();

        var caller = ResolveCaller(httpContext);
        if (!CanAccess(caller, existing.CreatedBy)) return TypedResults.NotFound();

        try
        {
            var moved = await appointmentService.MoveAsync(id, request.NewDate, request.NewTime, cancellationToken);
            if (moved == null) return TypedResults.NotFound();

            return TypedResults.Ok(Map(moved));
        }
        catch (AppointmentSchedulingException ex)
        {
            return TypedResults.BadRequest(new { message = ex.Message });
        }
    }

    private static async Task<IResult> FindAppointmentsAsync(
        [FromQuery] string? date,
        [FromQuery] string? endDate,
        [FromQuery] string? status,
        [FromQuery] string? query,
        [FromQuery] int? page,
        [FromQuery] int? pageSize,
        IAppointmentService appointmentService,
        HttpContext httpContext,
        CancellationToken cancellationToken = default)
    {
        var caller = ResolveCaller(httpContext);
        var createdByFilter = caller.IsAdmin ? null : caller.UserName;

        var list = await appointmentService.FindAsync(date, endDate, status, query, page, pageSize, createdBy: createdByFilter, cancellationToken: cancellationToken);
        return TypedResults.Ok(list.Select(Map));
    }

    private static async Task<IResult> GetAppointmentAsync(
        string id,
        IAppointmentService appointmentService,
        HttpContext httpContext,
        CancellationToken cancellationToken = default)
    {
        var appointment = await appointmentService.GetByIdAsync(id, cancellationToken);
        if (appointment == null) return TypedResults.NotFound();

        var caller = ResolveCaller(httpContext);
        if (!CanAccess(caller, appointment.CreatedBy)) return TypedResults.NotFound();

        return TypedResults.Ok(Map(appointment));
    }

    private static async Task<IResult> DeleteAppointmentAsync(
        string id,
        IAppointmentService appointmentService,
        HttpContext httpContext,
        CancellationToken cancellationToken = default)
    {
        var existing = await appointmentService.GetByIdAsync(id, cancellationToken);
        if (existing == null) return TypedResults.NotFound();

        var caller = ResolveCaller(httpContext);
        if (!CanAccess(caller, existing.CreatedBy)) return TypedResults.NotFound();

        var ok = await appointmentService.DeleteAsync(id, cancellationToken);
        return ok ? TypedResults.NoContent() : TypedResults.NotFound();
    }

    private static async Task<IResult> NextAppointmentIdAsync(IAppointmentService appointmentService)
    {
        var id = await appointmentService.GetNextIdAsync();
        return TypedResults.Ok(new { nextId = id });
    }

    /// <summary>
    /// Resolves the calling user's identity and whether they're Admin, which bypasses
    /// ownership checks entirely. Ownership (see <see cref="CanAccess"/>) is per-barber
    /// (matched against a record's CreatedBy), not per-shop: two barbers who happen to
    /// share a ShopId still can't see each other's appointments/clients - ShopId is
    /// informational grouping only, never the access-control boundary.
    /// </summary>
    internal static CallerContext ResolveCaller(HttpContext httpContext)
    {
        if (httpContext.User.IsAdmin()) return new CallerContext(true, null);

        var userName = httpContext.User.GetUserName();
        return new CallerContext(false, userName);
    }

    internal static bool CanAccess(CallerContext caller, string? recordCreatedBy) =>
        caller.IsAdmin || (!string.IsNullOrEmpty(caller.UserName) && caller.UserName == recordCreatedBy);

    internal readonly record struct CallerContext(bool IsAdmin, string? UserName);

    private static AppointmentResponse Map(Domain.Entities.Appointments a) => new(
        a.Id,
        a.ClientName,
        a.Phone,
        a.ClientId,
        a.Date,
        a.Time,
        a.Status,
        a.CompletedAt,
        a.PaymentMethodUsed,
        a.ServiceName,
        a.ServicePrice,
        a.Notes,
        a.ShopId,
        a.CreatedAt,
        a.UpdatedAt,
        a.CreatedBy,
        a.UpdatedBy
    );
}
