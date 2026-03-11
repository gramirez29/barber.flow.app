using Barber.Flow.Api.DTOs.Requests;
using Barber.Flow.Api.DTOs.Responses;
using Barber.Flow.Application.Services.Clients;
using Barber.Flow.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using static System.Net.WebRequestMethods;

namespace Barber.Flow.Api.Apis;

public static class ClientsApi
{
    private static readonly string ClientTagName = "Clients";

    public static RouteGroupBuilder MapClientsApi(this IEndpointRouteBuilder app)
    {
        var api = app.MapGroup("api/clients")
            .RequireAuthorization();

        // OPTIONAL: .AllowAnonymous(); -> Allow anonymous for read/list if you want public listing

        api.MapPost("/create", CreateClientAsync)
            .WithName(nameof(CreateClientAsync))
            .WithTags(ClientTagName)
            .AllowAnonymous();

        api.MapPut("/update/{id}", UpdateClientAsync)
            .WithName(nameof(UpdateClientAsync))
            .WithTags(ClientTagName);
        
        api.MapGet("/search", FindClientsAsync)
            .WithName(nameof(FindClientsAsync))
            .WithTags(ClientTagName)
            .AllowAnonymous();
        
        api.MapGet("/getById/{id}", GetClientAsync)
            .WithName(nameof(GetClientAsync))
            .WithTags(ClientTagName)
            .AllowAnonymous();
        
        api.MapDelete("/delete/{id}", DeleteClientAsync)
            .WithName(nameof(DeleteClientAsync))
            .WithTags(ClientTagName);

        return api;
    }

    private static async Task<IResult> CreateClientAsync(
        ClientRequest request,
        IClientService clientService,
        HttpContext httpContext,
        CancellationToken cancellationToken = default)
    {
        var userId = 
            httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ??httpContext.User.Identity?.Name;

        var client = new Client
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Phone = request.Phone,
            Address = request.Address,
            Birthday = request.Birthday,
            Preferences = request.Preferences,
            PaymentMethod = request.PaymentMethod,
            Active = request.Active,
            CreatedBy = userId!,
            UpdatedBy = userId!
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
        var userId = 
            httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ??httpContext.User.Identity?.Name;

        var client = new Client
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Phone = request.Phone,
            Address = request.Address,
            Birthday = request.Birthday,
            Preferences = request.Preferences,
            PaymentMethod = request.PaymentMethod,
            Active = request.Active,
            UpdatedBy = userId!
        };

        var updated = await clientService.UpdateAsync(id, client);
        if (updated == null)
        {
            return TypedResults.NotFound();
        }

        return TypedResults.Ok(Map(updated));
    }

    private static async Task<IResult> FindClientsAsync([FromQuery] string? query, IClientService clientService)
    {
        var list = await clientService.FindAsync(query);
        return TypedResults.Ok(list.Select(Map));
    }

    private static async Task<IResult> GetClientAsync(string id, IClientService clientService)
    {
        var c = await clientService.GetByIdAsync(id);
        return c == null ? TypedResults.NotFound() : TypedResults.Ok(Map(c));
    }

    private static async Task<IResult> DeleteClientAsync(string id, IClientService clientService)
    {
        var ok = await clientService.DeleteAsync(id);
        return ok ? TypedResults.Ok() : TypedResults.NotFound();
    }

    private static ClientResponse Map(Client client) =>
        new
        (
            client.Id,
            client.FirstName,
            client.LastName,
            client.Phone,
            client.Address,
            client.Birthday,
            client.Preferences,
            client.PaymentMethod,
            client.Active,
            client.CreatedAt,
            client.UpdatedAt
        );
}
