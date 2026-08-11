using Barber.Flow.Application.Services.Appointments;
using Barber.Flow.Application.Services.Auth;
using Barber.Flow.Application.Services.Sample.Queries;
using Barber.Flow.Domain.Interfaces;
using Barber.Flow.Infrastructure.Services.Auth;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Reflection;
using System.Text;
using Barber.Flow.Application.Services.Clients;
using Barber.Flow.Application.Services.Barbers;
using Barber.Flow.Application.Services.BarberShops;
using Barber.Flow.Infrastructure.Services.InMemory;
using Barber.Flow.Infrastructure.Services.MongoDb;
using Barber.Flow.Infrastructure.Settings;
using Barber.Flow.Infrastructure.Services;
using Barber.Flow.Application.Services.Users;
using Barber.Flow.Application.Services.Reports;
using Barber.Flow.Api.DTOs.Requests;
using FluentValidation;
using Microsoft.AspNetCore.RateLimiting;
using MongoDB.Driver;
using System.Threading.RateLimiting;

namespace Barber.Flow.Api.Extensions;

public static class ApplicationExtensions
{
    public static IServiceCollection AddApplicationServices(
        this IServiceCollection services,
        IConfiguration configuration,
        IHostEnvironment environment)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        services.AddControllers();

        // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen();
        services.AddAuthorization();
        services.AddTransient<ISampleQuery, SampleQuery>();

        services.AddScoped<IAuthService, AuthService>();

        // Bind feature flags and MongoDB settings
        services.Configure<FeatureFlags>(configuration.GetSection("Features"));
        services.Configure<MongoDbSettings>(configuration.GetSection("MongoDb"));
        services.Configure<ResendSettings>(configuration.GetSection("Resend"));

        var useMongoDb = configuration.GetValue<bool>("Features:UseMongoDb");
        var useRealEmail = configuration.GetValue<bool>("Features:UseRealEmail");

        services.AddScoped<IClientService, ClientService>();
        services.AddScoped<IBarberShopService, BarberShopService>();

        if (useRealEmail)
        {
            var resendApiKey = configuration.GetSection("Resend").Get<ResendSettings>()?.ApiKey
                ?? throw new InvalidOperationException("Resend:ApiKey is required when Features:UseRealEmail is true.");

            services.AddHttpClient<IEmailService, ResendEmailService>(client =>
            {
                client.BaseAddress = new Uri("https://api.resend.com/");
                client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", resendApiKey);
            });
        }
        else
        {
            services.AddScoped<IEmailService, ConsoleEmailService>();
        }

        if (useMongoDb)
        {
            var mongoSettings = configuration.GetSection("MongoDb").Get<MongoDbSettings>()
                ?? throw new InvalidOperationException("MongoDb settings are required when Features:UseMongoDb is true.");

            // MONGODB_URI is injected by the Railway MongoDB Atlas plugin at runtime
            var mongoConnectionString = Environment.GetEnvironmentVariable("MONGODB_URI")
                ?? mongoSettings.ConnectionString;

            services.AddSingleton<IMongoClient>(_ => new MongoClient(mongoConnectionString));
            services.AddSingleton<IMongoDatabase>(sp =>
                sp.GetRequiredService<IMongoClient>().GetDatabase(mongoSettings.DatabaseName));

            services.AddHostedService<MongoDbBootstrapper>();
            services.AddSingleton<IClientRepository, MongoDbClientRepository>();
            services.AddSingleton<IBarberShopRepository, MongoDbBarberShopRepository>();
            services.AddSingleton<IAppointmentRepository, MongoDbAppointmentRepository>();
            services.AddSingleton<IPasswordResetRepository, MongoDbPasswordResetRepository>();
            services.AddSingleton<IRefreshTokenRepository, MongoDbRefreshTokenRepository>();
            services.AddSingleton<IBarberRepository, MongoDbBarberRepository>();
            services.AddSingleton<IUserRepository, MongoDbUserRepository>();
            services.AddSingleton<IReportRepository, MongoDbReportRepository>();
            services.AddSingleton<Barber.Flow.Infrastructure.Services.IDataMigrationService, Barber.Flow.Infrastructure.Services.DataMigrationService>();
        }
        else
        {
            services.AddSingleton<IClientRepository, InMemoryClientRepository>();
            services.AddSingleton<IBarberShopRepository, InMemoryBarberShopRepository>();
            services.AddSingleton<IAppointmentRepository, InMemoryAppointmentRepository>();
            services.AddSingleton<IPasswordResetRepository, InMemoryPasswordResetRepository>();
            services.AddSingleton<IRefreshTokenRepository, InMemoryRefreshTokenRepository>();
            services.AddSingleton<IBarberRepository, InMemoryBarberRepository>();
            services.AddSingleton<IUserRepository, InMemoryUserRepository>();
            services.AddSingleton<IReportRepository, InMemoryReportRepository>();
        }

        services.AddScoped<IBarberService, BarberService>();

        services.AddSingleton<IUserTokenBuilder, UserTokenBuilder>();
        services.AddScoped<IUserService, UserService>();

        services.AddScoped<IReportService, ReportService>();

        services.AddScoped<IAppointmentService, AppointmentService>();

        services.AddScoped<IValidator<BarberRequest>, BarberRequestValidator>();

        // services.AddSwaggerDocumentation(configuration);

        return services;
    }

    public static IServiceCollection AddAllowCORS(this IServiceCollection services, IConfiguration configuration)
    {
        // Only browsers enforce CORS - the mobile app calls the API directly and is unaffected.
        // Defaults cover local Vite dev; add real deployed web origins via the Cors:AllowedOrigins
        // config section (or the Cors__AllowedOrigins__0, __1, ... env vars) once one exists.
        var configuredOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
        var defaultDevOrigins = new[] { "http://localhost:3005", "http://localhost:5173" };
        var allowedOrigins = configuredOrigins.Concat(defaultDevOrigins).Distinct().ToArray();

        services.AddCors(options =>
        {
            options.AddPolicy("AllowExpoApp", policy =>
            {
                policy
                    .WithOrigins(allowedOrigins)
                    .AllowAnyHeader()
                    .AllowAnyMethod();
            });
        });

        return services;
    }

    /// <summary>
    /// Simple per-IP rate limit for login and password-recovery endpoints, to slow down
    /// credential-stuffing and OTP brute-force attempts. Named policy "auth", applied per-route
    /// via .RequireRateLimiting("auth"). Kept generous in Development so local dev/test runs
    /// (both use the "Development" environment, including the integration test host, which
    /// re-authenticates many times per run) never trip it.
    /// </summary>
    public static IServiceCollection AddAuthRateLimiting(this IServiceCollection services, IHostEnvironment environment)
    {
        var permitLimit = environment.IsDevelopment() ? 1000 : 5;

        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            options.AddPolicy("auth", context =>
            {
                var partitionKey = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
                return RateLimitPartition.GetFixedWindowLimiter(partitionKey, _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = permitLimit,
                    Window = TimeSpan.FromMinutes(1),
                    QueueLimit = 0,
                });
            });
        });

        return services;
    }

    public static IServiceCollection AddAuthentication(this IServiceCollection services, IConfiguration configuration, IHostEnvironment environment)
    {
        // Retrieve JWT configuration
        var jwt = configuration.GetSection("Jwt");
        var key = jwt["Key"] ?? throw new InvalidOperationException("Jwt:Key not configured");

        if (environment.IsProduction())
        {
            const string placeholder = "ReplaceViaRailwayEnvVar-Jwt__Key";
            if (key == placeholder || Encoding.UTF8.GetByteCount(key) < 32)
            {
                throw new InvalidOperationException(
                    "Jwt:Key is missing, still the placeholder value, or too short for HS256 (needs at least 32 bytes). " +
                    "Set a real secret via the Jwt__Key environment variable before starting in Production.");
            }
        }

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.RequireHttpsMetadata = !environment.IsDevelopment(); // Use HTTPS in production
            options.SaveToken = true;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateIssuerSigningKey = true,
                ValidateLifetime = true, // Ensure token expiration is validated
                RequireExpirationTime = true, // Ensure tokens have an expiration time
                ValidIssuer = jwt["Issuer"],
                ValidAudience = jwt["Audience"],
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
                ClockSkew = TimeSpan.Zero
            };
        });

        return services;
    }

    private static IServiceCollection AddSwaggerDocumentation(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(options =>
        {
            var xmlFilename = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
            options.IncludeXmlComments(Path.Combine(AppContext.BaseDirectory, xmlFilename));
            options.SwaggerDoc("v1", configuration.GetSection(nameof(OpenApiInfo)).Get<OpenApiInfo>());
        });
        return services;
    }
}
