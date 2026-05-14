using Barber.Flow.Api.DTOs.Requests;
using Barber.Flow.Api.DTOs.Responses;
using Barber.Flow.Application.Services.Appointments;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.JsonWebTokens;
using System.Security.Claims;

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
        var userId = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? httpContext.User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? httpContext.User.FindFirst("username")?.Value
            ?? httpContext.User.Identity?.Name
            ?? string.Empty;

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

        var created = await appointmentService.CreateAsync(appointment, cancellationToken);
        return TypedResults.Ok(Map(created));
    }

    private static async Task<IResult> UpdateAppointmentAsync(
        string id,
        AppointmentRequest request,
        IAppointmentService appointmentService,
        HttpContext httpContext,
        CancellationToken cancellationToken = default)
    {
        var userId = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? httpContext.User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? httpContext.User.FindFirst("username")?.Value
            ?? httpContext.User.Identity?.Name
            ?? string.Empty;

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

        var updated = await appointmentService.UpdateAsync(id, appointment, cancellationToken);
        if (updated == null) return TypedResults.NotFound();

        return TypedResults.Ok(Map(updated));
    }

    private static async Task<IResult> MoveAppointmentAsync(
        string id,
        MoveAppointmentRequest request,
        IAppointmentService appointmentService,
        CancellationToken cancellationToken = default)
    {
        var moved = await appointmentService.MoveAsync(id, request.NewDate, cancellationToken);
        if (moved == null) return TypedResults.NotFound();

        return TypedResults.Ok(Map(moved));
    }

    private static async Task<IResult> FindAppointmentsAsync(
        [FromQuery] string? date,
        [FromQuery] string? status,
        [FromQuery] string? query,
        [FromQuery] int? page,
        [FromQuery] int? pageSize,
        IAppointmentService appointmentService,
        CancellationToken cancellationToken = default)
    {
        var list = await appointmentService.FindAsync(date, status, query, page, pageSize, cancellationToken);
        return TypedResults.Ok(list.Select(Map));
    }

    private static async Task<IResult> GetAppointmentAsync(
        string id,
        IAppointmentService appointmentService,
        CancellationToken cancellationToken = default)
    {
        var appointment = await appointmentService.GetByIdAsync(id, cancellationToken);
        return appointment == null ? TypedResults.NotFound() : TypedResults.Ok(Map(appointment));
    }

    private static async Task<IResult> DeleteAppointmentAsync(
        string id,
        IAppointmentService appointmentService,
        CancellationToken cancellationToken = default)
    {
        var ok = await appointmentService.DeleteAsync(id, cancellationToken);
        return ok ? TypedResults.NoContent() : TypedResults.NotFound();
    }

    private static async Task<IResult> NextAppointmentIdAsync(IAppointmentService appointmentService)
    {
        var id = await appointmentService.GetNextIdAsync();
        return TypedResults.Ok(new { nextId = id });
    }

    private static AppointmentResponse Map(Domain.Entities.Appointments a) => new(
        a.Id,
        a.ClientName,
        a.Phone,
        a.Date,
        a.Time,
        a.Status,
        a.CompletedAt,
        a.PaymentMethodUsed,
        a.ServiceName,
        a.ServicePrice,
        a.Notes,
        a.CreatedAt,
        a.UpdatedAt,
        a.CreatedBy,
        a.UpdatedBy
    );
}
