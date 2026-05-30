using Barber.Flow.Api.DTOs.Requests;
using Barber.Flow.Api.DTOs.Responses;
using Barber.Flow.Domain.Entities;
using Barber.Flow.Domain.Interfaces;
using System.Security.Claims;

namespace Barber.Flow.Api.Apis;

public static class BarberShopsApi
{
    private static readonly string TagName = "BarberShops";

    public static RouteGroupBuilder MapBarberShopsApi(this IEndpointRouteBuilder app)
    {
        var api = app.MapGroup("api/barbershops")
            .RequireAuthorization();

        api.MapPost("/create", CreateAsync)
            .WithName(nameof(CreateAsync))
            .WithTags(TagName);

        api.MapPut("/update/{id}", UpdateAsync)
            .WithName(nameof(UpdateAsync))
            .WithTags(TagName);

        api.MapGet("/list", GetAllAsync)
            .WithName(nameof(GetAllAsync))
            .WithTags(TagName);

        api.MapGet("/getById/{id}", GetByIdAsync)
            .WithName(nameof(GetByIdAsync))
            .WithTags(TagName);

        api.MapDelete("/delete/{id}", DeleteAsync)
            .WithName(nameof(DeleteAsync))
            .WithTags(TagName);

        return api;
    }

    private static async Task<IResult> CreateAsync(
        BarberShopRequest request,
        IBarberShopRepository repository,
        HttpContext httpContext,
        CancellationToken cancellationToken = default)
    {
        var userId = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                     ?? httpContext.User.Identity?.Name 
                     ?? throw new UnauthorizedAccessException("User not authenticated");

        var barberShop = new BarberShop
        {
            Name = request.Name,
            Phone = request.Phone,
            Address = request.Address,
            CreatedBy = userId,
            UpdatedBy = userId
        };

        var created = await repository.CreateAsync(barberShop);
        return TypedResults.Ok(MapToResponse(created));
    }

    private static async Task<IResult> UpdateAsync(
        string id,
        BarberShopRequest request,
        IBarberShopRepository repository,
        HttpContext httpContext,
        CancellationToken cancellationToken = default)
    {
        var userId = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                     ?? httpContext.User.Identity?.Name 
                     ?? throw new UnauthorizedAccessException("User not authenticated");

        var barberShop = new BarberShop
        {
            Id = id,
            Name = request.Name,
            Phone = request.Phone,
            Address = request.Address,
            UpdatedBy = userId
        };

        try
        {
            var updated = await repository.UpdateAsync(barberShop);
            return TypedResults.Ok(MapToResponse(updated));
        }
        catch (InvalidOperationException ex)
        {
            return TypedResults.NotFound(new { error = ex.Message });
        }
    }

    private static async Task<IResult> GetAllAsync(
        IBarberShopRepository repository,
        HttpContext httpContext,
        int page = 1,
        int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var userId = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                     ?? httpContext.User.Identity?.Name 
                     ?? throw new UnauthorizedAccessException("User not authenticated");

        var shops = await repository.GetAllAsync(userId, page, pageSize);
        var response = shops.Select(MapToResponse);
        return TypedResults.Ok(response);
    }

    private static async Task<IResult> GetByIdAsync(
        string id,
        IBarberShopRepository repository,
        HttpContext httpContext,
        CancellationToken cancellationToken = default)
    {
        var userId = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                     ?? httpContext.User.Identity?.Name 
                     ?? throw new UnauthorizedAccessException("User not authenticated");

        var shop = await repository.GetByIdAsync(id, userId);
        if (shop == null)
            return TypedResults.NotFound(new { error = "BarberShop not found" });

        return TypedResults.Ok(MapToResponse(shop));
    }

    private static async Task<IResult> DeleteAsync(
        string id,
        IBarberShopRepository repository,
        HttpContext httpContext,
        CancellationToken cancellationToken = default)
    {
        var userId = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                     ?? httpContext.User.Identity?.Name 
                     ?? throw new UnauthorizedAccessException("User not authenticated");

        var deleted = await repository.DeleteAsync(id, userId);
        if (!deleted)
            return TypedResults.NotFound(new { error = "BarberShop not found or unauthorized" });

        return TypedResults.Ok(new { message = "BarberShop deleted successfully" });
    }

    private static BarberShopResponse MapToResponse(BarberShop shop) => new(
        shop.Id,
        shop.Name,
        shop.Phone,
        shop.Address,
        shop.CreatedAt,
        shop.UpdatedAt
    );
}
