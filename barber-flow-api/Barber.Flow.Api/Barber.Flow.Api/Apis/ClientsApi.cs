using Barber.Flow.Api.DTOs.Requests;
using Barber.Flow.Api.DTOs.Responses;
using Barber.Flow.Api.Extensions;
using Barber.Flow.Application.Services.Clients;
using Barber.Flow.Domain.Entities;
using Barber.Flow.Domain.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Barber.Flow.Api.Apis;

public static class ClientsApi
{
    private static readonly string ClientTagName = "Clients";

    public static RouteGroupBuilder MapClientsApi(this IEndpointRouteBuilder app)
    {
        var api = app.MapGroup("api/clients")
            .RequireAuthorization();

        api.MapPost("/create", CreateClientAsync)
            .WithName(nameof(CreateClientAsync))
            .WithTags(ClientTagName);

        api.MapPut("/update/{id}", UpdateClientAsync)
            .WithName(nameof(UpdateClientAsync))
            .WithTags(ClientTagName);

        api.MapGet("/search", FindClientsAsync)
            .WithName(nameof(FindClientsAsync))
            .WithTags(ClientTagName);

        api.MapGet("/getById/{id}", GetClientAsync)
            .WithName(nameof(GetClientAsync))
            .WithTags(ClientTagName);
        
        api.MapDelete("/delete/{id}", DeleteClientAsync)
            .WithName(nameof(DeleteClientAsync))
            .WithTags(ClientTagName);

        api.MapGet("/{id}/appointments/history", GetClientHistoryAsync)
            .WithName(nameof(GetClientHistoryAsync))
            .WithTags(ClientTagName);

        api.MapGet("/{id}/stats", GetClientStatsAsync)
            .WithName(nameof(GetClientStatsAsync))
            .WithTags(ClientTagName);

        api.MapGet("/findByPhone", FindByPhoneAsync)
            .WithName(nameof(FindByPhoneAsync))
            .WithTags(ClientTagName);
            
        return api;
    }

    private static async Task<IResult> CreateClientAsync(
        ClientRequest request,
        IClientService clientService,
        HttpContext httpContext,
        CancellationToken cancellationToken = default)
    {
        var userId = httpContext.User.GetUserName() ?? string.Empty;

        var client = new Client
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Phone = request.Phone,
            Email = request.Email,
            Address = request.Address,
            Birthday = request.Birthday,
            Preferences = request.Preferences,
            PaymentMethod = request.PaymentMethod,
            Active = request.Active,
            PhotoUrl = request.PhotoUrl,
            CreatedBy = userId,
            UpdatedBy = userId
        };

        var created = await clientService.CreateAsync(client, cancellationToken);
        var dto = Map(created);
        return TypedResults.Ok(dto);
    }

    private static async Task<IResult> UpdateClientAsync(
        string id,
        ClientRequest request,
        IClientService clientService,
        HttpContext httpContext,
        CancellationToken cancellationToken = default
        )
    {
        var existing = await clientService.GetByIdAsync(id, cancellationToken);
        if (existing == null) return TypedResults.NotFound();

        var caller = AppointmentsApi.ResolveCaller(httpContext);
        if (!AppointmentsApi.CanAccess(caller, existing.CreatedBy)) return TypedResults.NotFound();

        var userId = httpContext.User.GetUserName() ?? string.Empty;

        var client = new Client
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Phone = request.Phone,
            Email = request.Email,
            Address = request.Address,
            Birthday = request.Birthday,
            Preferences = request.Preferences,
            PaymentMethod = request.PaymentMethod,
            Active = request.Active,
            PhotoUrl = request.PhotoUrl,
            UpdatedBy = userId
        };

        var updated = await clientService.UpdateAsync(id, client, cancellationToken);
        if (updated == null)
        {
            return TypedResults.NotFound();
        }

        return TypedResults.Ok(Map(updated));
    }

    private static async Task<IResult> FindClientsAsync(
        [FromQuery] string? query,
        [FromQuery] int? page,
        [FromQuery] int? pageSize,
        IClientService clientService,
        HttpContext httpContext,
        CancellationToken cancellationToken = default)
    {
        var caller = AppointmentsApi.ResolveCaller(httpContext);
        var createdByFilter = caller.IsAdmin ? null : caller.UserName;

        var list = await clientService.FindAsync(query, page, pageSize, createdBy: createdByFilter, cancellationToken: cancellationToken);
        return TypedResults.Ok(list.Select(Map));
    }

    private static async Task<IResult> GetClientAsync(
        string id,
        IClientService clientService,
        HttpContext httpContext,
        CancellationToken cancellationToken = default)
    {
        var c = await clientService.GetByIdAsync(id, cancellationToken);
        if (c == null) return TypedResults.NotFound();

        var caller = AppointmentsApi.ResolveCaller(httpContext);
        if (!AppointmentsApi.CanAccess(caller, c.CreatedBy)) return TypedResults.NotFound();

        return TypedResults.Ok(Map(c));
    }

    private static async Task<IResult> DeleteClientAsync(
        string id,
        IClientService clientService,
        HttpContext httpContext,
        CancellationToken cancellationToken = default)
    {
        var existing = await clientService.GetByIdAsync(id, cancellationToken);
        if (existing == null) return TypedResults.NotFound();

        var caller = AppointmentsApi.ResolveCaller(httpContext);
        if (!AppointmentsApi.CanAccess(caller, existing.CreatedBy)) return TypedResults.NotFound();

        var ok = await clientService.DeleteAsync(id, cancellationToken);
        return ok ? TypedResults.NoContent() : TypedResults.NotFound();
    }

    private static ClientResponse Map(Client client) =>
        new
        (
            client.Id,
            client.FirstName,
            client.LastName,
            client.Phone,
            client.Email,
            client.Address,
            client.Birthday,
            client.Preferences,
            client.PaymentMethod,
            client.Active,
            client.PhotoUrl,
            client.ShopId,
            client.CreatedAt,
            client.UpdatedAt
        );

    private static async Task<IResult> GetClientHistoryAsync(
        string id,
        IAppointmentRepository appointmentRepository,
        HttpContext httpContext,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var userId = httpContext.User.GetUserName()
                     ?? throw new UnauthorizedAccessException("User not authenticated");

        var history = await appointmentRepository.GetClientHistoryAsync(id, userId, page, pageSize, cancellationToken);
        var response = history.Select(MapAppointment);
        return TypedResults.Ok(response);
    }

    private static async Task<IResult> GetClientStatsAsync(
        string id,
        IAppointmentRepository appointmentRepository,
        HttpContext httpContext,
        CancellationToken cancellationToken = default)
    {
        var userId = httpContext.User.GetUserName()
                     ?? throw new UnauthorizedAccessException("User not authenticated");

        var allAppointments = await appointmentRepository.GetClientHistoryAsync(id, userId, 1, 1000, cancellationToken);
        var appointmentsList = allAppointments.ToList();

        var stats = new ClientStatsResponse(
            TotalAppointments: appointmentsList.Count,
            CompletedAppointments: appointmentsList.Count(a => a.Status == "completed"),
            CancelledAppointments: appointmentsList.Count(a => a.Status == "cancelled"),
            TotalSpent: appointmentsList.Where(a => a.Status == "completed").Sum(a => a.ServicePrice ?? 0),
            LastVisit: appointmentsList
                .Where(a => a.Status == "completed")
                .OrderByDescending(a => a.Date)
                .ThenByDescending(a => a.Time)
                .FirstOrDefault()?.Date,
            PreferredPaymentMethod: appointmentsList
                .Where(a => !string.IsNullOrEmpty(a.PaymentMethodUsed))
                .GroupBy(a => a.PaymentMethodUsed)
                .OrderByDescending(g => g.Count())
                .FirstOrDefault()?.Key
        );

        return TypedResults.Ok(stats);
    }

    private static async Task<IResult> FindByPhoneAsync(
        [FromQuery] string phone,
        IAppointmentRepository appointmentRepository,
        IClientService clientService,
        HttpContext httpContext,
        CancellationToken cancellationToken = default)
    {
        var userId = httpContext.User.GetUserName()
                     ?? throw new UnauthorizedAccessException("User not authenticated");

        // Try to find client by phone
        var clients = await clientService.FindAsync(phone, 1, 1, cancellationToken: cancellationToken);
        var client = clients.FirstOrDefault();

        if (client != null)
        {
            return TypedResults.Ok(new { client = Map(client), found = true });
        }

        // If not found, check if there's an appointment with this phone
        var appointment = await appointmentRepository.FindByPhoneAsync(phone, userId, cancellationToken);
        
        if (appointment != null)
        {
            return TypedResults.Ok(new 
            { 
                clientName = appointment.ClientName, 
                phone = appointment.Phone,
                found = false 
            });
        }

        return TypedResults.NotFound(new { message = "No client or appointment found with this phone" });
    }

    private static AppointmentResponse MapAppointment(Appointments appointment) =>
        new
        (
            appointment.Id,
            appointment.ClientName,
            appointment.Phone,
            appointment.ClientId,
            appointment.Date,
            appointment.Time,
            appointment.Status,
            appointment.CompletedAt,
            appointment.PaymentMethodUsed,
            appointment.ServiceName,
            appointment.ServicePrice,
            appointment.Notes,
            appointment.ShopId,
            appointment.CreatedAt,
            appointment.UpdatedAt,
            appointment.CreatedBy,
            appointment.UpdatedBy
        );
}
