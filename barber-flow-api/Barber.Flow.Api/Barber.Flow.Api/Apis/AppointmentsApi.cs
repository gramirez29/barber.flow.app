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
        IBarberRepository barberRepository,
        HttpContext httpContext,
        CancellationToken cancellationToken = default)
    {
        var existing = await appointmentService.GetByIdAsync(id, cancellationToken);
        if (existing == null) return TypedResults.NotFound();

        var caller = await ResolveCallerAsync(httpContext, barberRepository, cancellationToken);
        if (!CanAccess(caller, existing.ShopId)) return TypedResults.NotFound();

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
        IBarberRepository barberRepository,
        HttpContext httpContext,
        CancellationToken cancellationToken = default)
    {
        var existing = await appointmentService.GetByIdAsync(id, cancellationToken);
        if (existing == null) return TypedResults.NotFound();

        var caller = await ResolveCallerAsync(httpContext, barberRepository, cancellationToken);
        if (!CanAccess(caller, existing.ShopId)) return TypedResults.NotFound();

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
        IBarberRepository barberRepository,
        HttpContext httpContext,
        CancellationToken cancellationToken = default)
    {
        var caller = await ResolveCallerAsync(httpContext, barberRepository, cancellationToken);
        var shopIdFilter = caller.IsAdmin ? null : caller.ShopId;

        var list = await appointmentService.FindAsync(date, endDate, status, query, page, pageSize, shopIdFilter, cancellationToken);
        return TypedResults.Ok(list.Select(Map));
    }

    private static async Task<IResult> GetAppointmentAsync(
        string id,
        IAppointmentService appointmentService,
        IBarberRepository barberRepository,
        HttpContext httpContext,
        CancellationToken cancellationToken = default)
    {
        var appointment = await appointmentService.GetByIdAsync(id, cancellationToken);
        if (appointment == null) return TypedResults.NotFound();

        var caller = await ResolveCallerAsync(httpContext, barberRepository, cancellationToken);
        if (!CanAccess(caller, appointment.ShopId)) return TypedResults.NotFound();

        return TypedResults.Ok(Map(appointment));
    }

    private static async Task<IResult> DeleteAppointmentAsync(
        string id,
        IAppointmentService appointmentService,
        IBarberRepository barberRepository,
        HttpContext httpContext,
        CancellationToken cancellationToken = default)
    {
        var existing = await appointmentService.GetByIdAsync(id, cancellationToken);
        if (existing == null) return TypedResults.NotFound();

        var caller = await ResolveCallerAsync(httpContext, barberRepository, cancellationToken);
        if (!CanAccess(caller, existing.ShopId)) return TypedResults.NotFound();

        var ok = await appointmentService.DeleteAsync(id, cancellationToken);
        return ok ? TypedResults.NoContent() : TypedResults.NotFound();
    }

    private static async Task<IResult> NextAppointmentIdAsync(IAppointmentService appointmentService)
    {
        var id = await appointmentService.GetNextIdAsync();
        return TypedResults.Ok(new { nextId = id });
    }

    /// <summary>
    /// Resolves the calling barber's ShopId (the tenant boundary appointments/clients are
    /// isolated by) and whether they're Admin, which bypasses that isolation entirely.
    /// </summary>
    internal static async Task<CallerContext> ResolveCallerAsync(
        HttpContext httpContext, IBarberRepository barberRepository, CancellationToken cancellationToken)
    {
        if (httpContext.User.IsAdmin()) return new CallerContext(true, null);

        var userName = httpContext.User.GetUserName();
        if (string.IsNullOrWhiteSpace(userName)) return new CallerContext(false, null);

        var barber = await barberRepository.GetByUserNameAsync(userName, cancellationToken);
        return new CallerContext(false, barber?.ShopId);
    }

    internal static bool CanAccess(CallerContext caller, string? recordShopId) =>
        caller.IsAdmin || (!string.IsNullOrEmpty(caller.ShopId) && caller.ShopId == recordShopId);

    internal readonly record struct CallerContext(bool IsAdmin, string? ShopId);

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
