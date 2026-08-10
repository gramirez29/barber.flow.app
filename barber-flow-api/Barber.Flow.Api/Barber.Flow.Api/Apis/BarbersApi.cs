using Barber.Flow.Api.DTOs.Requests;
using Barber.Flow.Api.DTOs.Responses;
using Barber.Flow.Application.Services.Barbers;
using Barber.Flow.Application.Services.Users;
using Barber.Flow.Domain.ValueObjects;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.JsonWebTokens;
using System.Security.Claims;

namespace Barber.Flow.Api.Apis;

public static class BarbersApi
{
    private static readonly string BarberTag = "Barbers";

    public static RouteGroupBuilder MapBarbersApi(this IEndpointRouteBuilder app)
    {
        var api = app.MapGroup("api/barbers");

        api.MapPost("/create", CreateBarberAsync)
            .WithName(nameof(CreateBarberAsync))
            .WithTags(BarberTag)
            .RequireAuthorization();

        api.MapPut("/update/{id}", UpdateBarberAsync)
            .WithName(nameof(UpdateBarberAsync))
            .WithTags(BarberTag)
            .RequireAuthorization();

        api.MapGet("/search", FindBarbersAsync)
            .WithName(nameof(FindBarbersAsync))
            .WithTags(BarberTag)
            .AllowAnonymous();

        api.MapGet("/getById/{id}", GetBarberAsync)
            .WithName(nameof(GetBarberAsync))
            .WithTags(BarberTag)
            .AllowAnonymous();

        api.MapGet("/nextId", NextIdAsync)
            .WithName(nameof(NextIdAsync))
            .WithTags(BarberTag)
            .RequireAuthorization();

        api.MapDelete("/delete/{id}", DeleteBarberAsync)
            .WithName(nameof(DeleteBarberAsync))
            .WithTags(BarberTag)
            .RequireAuthorization();

        return api;
    }

    private static async Task<IResult> CreateBarberAsync(
        BarberRequest request,
        IBarberService barberService,
        IUserService userService,
        IValidator<BarberRequest> validator,
        HttpContext httpContext,
        CancellationToken cancellationToken = default)
    {
        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return TypedResults.ValidationProblem(validationResult.ToDictionary());
        }

        var userId = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? httpContext.User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? httpContext.User.FindFirst("username")?.Value
            ?? httpContext.User.Identity?.Name;
        var config = httpContext.RequestServices.GetRequiredService<IConfiguration>();
        var adminUser = config["BARBERFLOW_ADMIN_USERNAME"] ?? config["AdminUsername"] ?? "admin";
        if (!string.Equals(userId, adminUser, StringComparison.OrdinalIgnoreCase))
        {
            return TypedResults.StatusCode(StatusCodes.Status403Forbidden);
        }

        var barber = new Domain.Entities.Barber
        {
            UserName = request.UserName,
            UserPhone = request.UserPhone,
            UserEmail = request.UserEmail,
            BarberName = request.BarberName,
            BarberPhone = request.BarberPhone,
            Address = request.Address,
            BarberShopName = request.BarberShopName,
            BarberShopPhone = request.BarberShopPhone,
            PhotoUrl = request.PhotoUrl,
            Settings = request.Settings != null 
                ? new BarberSettings(request.Settings.CommissionPercentage, request.Settings.FixedDailyExpense) 
                : null,
            CreatedBy = userId ?? string.Empty,
            UpdatedBy = userId ?? string.Empty
        };

        var created = await barberService.CreateAsync(barber, cancellationToken);

        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            var newUser = new Domain.Entities.User
            {
                UserName = request.UserName,
                Password = request.Password,
                Name = request.BarberName,
                Email = request.UserEmail,
                Role = "Barber"
            };
            await userService.CreateAsync(newUser, cancellationToken);
        }

        var dto = Map(created);
        return TypedResults.Ok(dto);
    }

    private static async Task<IResult> UpdateBarberAsync(
        string id,
        BarberRequest request,
        IBarberService barberService,
        IUserService userService,
        IValidator<BarberRequest> validator,
        HttpContext httpContext,
        CancellationToken cancellationToken = default)
    {
        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return TypedResults.ValidationProblem(validationResult.ToDictionary());
        }

        var userId = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? httpContext.User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? httpContext.User.FindFirst("username")?.Value
            ?? httpContext.User.Identity?.Name;
        var config = httpContext.RequestServices.GetRequiredService<IConfiguration>();
        var adminUser = config["BARBERFLOW_ADMIN_USERNAME"] ?? config["AdminUsername"] ?? "admin";
        if (!string.Equals(userId, adminUser, StringComparison.OrdinalIgnoreCase))
        {
            return TypedResults.StatusCode(StatusCodes.Status403Forbidden);
        }

        var barber = new Domain.Entities.Barber
        {
            UserName = request.UserName,
            UserPhone = request.UserPhone,
            UserEmail = request.UserEmail,
            BarberName = request.BarberName,
            BarberPhone = request.BarberPhone,
            Address = request.Address,
            BarberShopName = request.BarberShopName,
            BarberShopPhone = request.BarberShopPhone,
            PhotoUrl = request.PhotoUrl,
            Settings = request.Settings != null
                ? new BarberSettings(request.Settings.CommissionPercentage, request.Settings.FixedDailyExpense)
                : null,
            UpdatedBy = userId ?? string.Empty
        };

        var updated = await barberService.UpdateAsync(id, barber, cancellationToken);
        if (updated == null) return TypedResults.NotFound();

        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            await userService.UpdatePasswordAsync(request.UserName, request.Password, cancellationToken);
        }

        return TypedResults.Ok(Map(updated));
    }

    private static async Task<IResult> FindBarbersAsync([FromQuery] string? query, [FromQuery] int? page, [FromQuery] int? pageSize, IBarberService barberService)
    {
        var list = await barberService.FindAsync(query, page, pageSize);
        return TypedResults.Ok(list.Select(Map));
    }

    private static async Task<IResult> GetBarberAsync(string id, IBarberService barberService)
    {
        var b = await barberService.GetByIdAsync(id);
        return b == null ? TypedResults.NotFound() : TypedResults.Ok(Map(b));
    }

    private static async Task<IResult> DeleteBarberAsync(string id, IBarberService barberService, HttpContext httpContext, CancellationToken cancellationToken = default)
    {
        var userId = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? httpContext.User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? httpContext.User.FindFirst("username")?.Value
            ?? httpContext.User.Identity?.Name;
        var config = httpContext.RequestServices.GetRequiredService<IConfiguration>();
        var adminUser = config["BARBERFLOW_ADMIN_USERNAME"] ?? config["AdminUsername"] ?? "admin";
        if (!string.Equals(userId, adminUser, StringComparison.OrdinalIgnoreCase))
        {
            return TypedResults.StatusCode(StatusCodes.Status403Forbidden);
        }

        var ok = await barberService.DeleteAsync(id, cancellationToken);
        return ok ? TypedResults.NoContent() : TypedResults.NotFound();
    }

    private static async Task<IResult> NextIdAsync(IBarberService barberService)
    {
        var id = await barberService.GetNextIdAsync();
        return TypedResults.Ok(new { nextId = id });
    }

    private static BarberResponse Map(Domain.Entities.Barber b) => new(
        b.Id,
        b.UserName,
        b.UserPhone,
        b.UserEmail,
        b.BarberName,
        b.BarberPhone,
        b.Address,
        b.BarberShopName,
        b.BarberShopPhone,
        b.PhotoUrl,
        b.Settings != null 
            ? new BarberSettingsDto(b.Settings.CommissionPercentage, b.Settings.FixedDailyExpense) 
            : null,
        b.ShopId,
        b.CreatedAt,
        b.UpdatedAt
    );
}
