using Barber.Flow.Api.DTOs.Requests;
using Barber.Flow.Api.Extensions;
using Barber.Flow.Api.DTOs.Responses;
using Barber.Flow.Application.Services.Auth;
using Barber.Flow.Application.Services.Barbers;
using Barber.Flow.Application.Services.Users;
using Barber.Flow.Domain.Exceptions;
using Barber.Flow.Domain.Interfaces;
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
            .RequireAuthorization();

        api.MapGet("/getById/{id}", GetBarberAsync)
            .WithName(nameof(GetBarberAsync))
            .WithTags(BarberTag)
            .RequireAuthorization();

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
        IUserRepository userRepository,
        IAuthService authService,
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

        // A linked User account is only created below when a password is supplied - but that
        // account's email must be unique (password recovery looks users up by email, and two
        // accounts sharing one would let a reset silently land on the wrong account - see
        // incident 2026-08-21). Check before creating anything, so a rejected duplicate never
        // leaves an orphaned Barber with no linked User.
        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            var existingUserWithEmail = await userRepository.GetByEmailAsync(request.UserEmail, cancellationToken);
            if (existingUserWithEmail != null)
            {
                return TypedResults.Conflict(new { message = "Ya existe una cuenta con ese correo electrónico." });
            }

            // Same reason as the email check: the User insert below would be rejected by its unique
            // username index only after the Barber (and its shop) already exist.
            var existingUserWithUserName = await userRepository.GetByUserNameAsync(request.UserName, cancellationToken);
            if (existingUserWithUserName != null)
            {
                return DuplicateUserName(request.UserName);
            }
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
                ? new BarberSettings(request.Settings.CommissionPercentage, request.Settings.FixedDailyExpense, request.Settings.MaxRecurringAppointments, request.Settings.EnableAppointmentDurations)
                : null,
            CreatedBy = userId ?? string.Empty,
            UpdatedBy = userId ?? string.Empty
        };

        Domain.Entities.Barber created;
        try
        {
            created = await barberService.CreateAsync(barber, cancellationToken);
        }
        catch (BarberUserNameConflictException ex)
        {
            return DuplicateUserName(ex.UserName);
        }

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

            await authService.SendWelcomeEmailAsync(
                request.UserEmail,
                request.BarberName,
                request.UserName,
                request.Password,
                cancellationToken);
        }

        var dto = await MapAsync(created, userRepository, cancellationToken);
        return TypedResults.Ok(dto);
    }

    private static async Task<IResult> UpdateBarberAsync(
        string id,
        BarberRequest request,
        IBarberService barberService,
        IUserService userService,
        IUserRepository userRepository,
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
                ? new BarberSettings(request.Settings.CommissionPercentage, request.Settings.FixedDailyExpense, request.Settings.MaxRecurringAppointments, request.Settings.EnableAppointmentDurations)
                : null,
            UpdatedBy = userId ?? string.Empty
        };

        Domain.Entities.Barber? updated;
        try
        {
            updated = await barberService.UpdateAsync(id, barber, cancellationToken);
        }
        catch (BarberUserNameConflictException ex)
        {
            return DuplicateUserName(ex.UserName);
        }

        if (updated == null) return TypedResults.NotFound();

        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            await userService.UpdatePasswordAsync(request.UserName, request.Password, cancellationToken);
        }

        return TypedResults.Ok(await MapAsync(updated, userRepository, cancellationToken));
    }

    private static async Task<IResult> FindBarbersAsync(
        [FromQuery] string? query,
        [FromQuery] int? page,
        [FromQuery] int? pageSize,
        IBarberService barberService,
        IUserRepository userRepository,
        HttpContext httpContext,
        CancellationToken cancellationToken = default)
    {
        var caller = AppointmentsApi.ResolveCaller(httpContext);
        if (caller.IsAdmin)
        {
            var all = await barberService.FindAsync(query, page, pageSize);
            var mappedAll = await Task.WhenAll(all.Select(b => MapAsync(b, userRepository, cancellationToken)));
            return TypedResults.Ok(mappedAll);
        }

        // A non-admin only ever sees their own barber record (clients look themselves up by
        // username to read their settings). The query/paging are ignored on purpose: honoring
        // them would let a barber enumerate the other tenants' accounts.
        if (string.IsNullOrEmpty(caller.UserName)) return TypedResults.Ok(Array.Empty<BarberResponse>());

        var candidates = await barberService.FindAsync(caller.UserName, null, null);
        var own = candidates.Where(b => string.Equals(b.UserName, caller.UserName, StringComparison.OrdinalIgnoreCase));
        var mapped = await Task.WhenAll(own.Select(b => MapAsync(b, userRepository, cancellationToken)));
        return TypedResults.Ok(mapped);
    }

    private static async Task<IResult> GetBarberAsync(string id, IBarberService barberService, IUserRepository userRepository, HttpContext httpContext, CancellationToken cancellationToken = default)
    {
        var b = await barberService.GetByIdAsync(id);
        if (b == null) return TypedResults.NotFound();

        // Same 404-not-403 convention as appointments/clients: don't reveal that another
        // tenant's barber exists.
        var caller = AppointmentsApi.ResolveCaller(httpContext);
        var isOwn = !string.IsNullOrEmpty(caller.UserName)
                    && string.Equals(b.UserName, caller.UserName, StringComparison.OrdinalIgnoreCase);
        if (!caller.IsAdmin && !isOwn) return TypedResults.NotFound();

        return TypedResults.Ok(await MapAsync(b, userRepository, cancellationToken));
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

    private static IResult DuplicateUserName(string? userName) =>
        TypedResults.Conflict(new
        {
            message = $"Ya existe una cuenta con el usuario '{userName}'.",
            code = BarberUserNameConflictException.ErrorCode,
        });

    private static async Task<IResult> NextIdAsync(IBarberService barberService, HttpContext httpContext)
    {
        // Only used to pre-fill the admin's "create barber" form; for anyone else it would
        // just leak how many barbers exist on the platform.
        if (!httpContext.User.IsAdmin()) return TypedResults.StatusCode(StatusCodes.Status403Forbidden);

        var id = await barberService.GetNextIdAsync();
        return TypedResults.Ok(new { nextId = id });
    }

    private static async Task<BarberResponse> MapAsync(Domain.Entities.Barber b, IUserRepository userRepository, CancellationToken cancellationToken)
    {
        var linkedUser = string.IsNullOrWhiteSpace(b.UserName)
            ? null
            : await userRepository.GetByUserNameAsync(b.UserName, cancellationToken);

        return new BarberResponse(
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
                ? new BarberSettingsDto(b.Settings.CommissionPercentage, b.Settings.FixedDailyExpense, b.Settings.MaxRecurringAppointments ?? 0, b.Settings.EnableAppointmentDurations ?? false)
                : null,
            b.ShopId,
            b.CreatedAt,
            b.UpdatedAt,
            linkedUser?.Id,
            linkedUser?.IsBlocked
        );
    }
}
