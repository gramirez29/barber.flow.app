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
using Barber.Flow.Infrastructure.Services.InMemory;
using Barber.Flow.Infrastructure.Services.MongoDb;
using Barber.Flow.Infrastructure.Settings;
using Barber.Flow.Infrastructure.Services;
using Barber.Flow.Application.Services.Users;
using Barber.Flow.Application.Services.Reports;
using Barber.Flow.Api.DTOs.Requests;
using FluentValidation;
using MongoDB.Driver;

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
        services.AddScoped<IJwtAuthService, JwtAuthService>();

        // Bind feature flags and MongoDB settings
        services.Configure<FeatureFlags>(configuration.GetSection("Features"));
        services.Configure<MongoDbSettings>(configuration.GetSection("MongoDb"));
        services.Configure<EmailSettings>(configuration.GetSection("Email"));

        var useMongoDb = configuration.GetValue<bool>("Features:UseMongoDb");
        var useRealEmail = configuration.GetValue<bool>("Features:UseRealEmail");

        services.AddScoped<IClientService, ClientService>();

        if (useRealEmail)
        {
            services.AddScoped<IEmailService, EmailService>();
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
            services.AddSingleton<Barber.Flow.Infrastructure.Services.IDataMigrationService, Barber.Flow.Infrastructure.Services.DataMigrationService>();
        }
        else
        {
            services.AddSingleton<IClientRepository, InMemoryClientRepository>();
            services.AddSingleton<IBarberShopRepository, InMemoryBarberShopRepository>();
            services.AddSingleton<IAppointmentRepository, InMemoryAppointmentRepository>();
            services.AddSingleton<IPasswordResetRepository, InMemoryPasswordResetRepository>();
        }

        services.AddScoped<IBarberService, BarberService>();
        services.AddSingleton<IBarberRepository, InMemoryBarberRepository>();

        services.AddScoped<IUserService, UserService>();
        services.AddSingleton<IUserRepository, InMemoryUserRepository>();

        services.AddScoped<IReportService, ReportService>();
        services.AddSingleton<IReportRepository, InMemoryReportRepository>();

        services.AddScoped<IAppointmentService, AppointmentService>();

        services.AddScoped<IValidator<BarberRequest>, BarberRequestValidator>();

        // services.AddSwaggerDocumentation(configuration);

        return services;
    }

    public static IServiceCollection AddAllowCORS(this IServiceCollection services) 
    {
        services.AddCors(options =>
        {
            options.AddPolicy("AllowExpoApp", policy =>
            {
                policy
                    .AllowAnyOrigin()
                    .AllowAnyHeader()
                    .AllowAnyMethod();
            });
        });

        return services;
    }

    public static IServiceCollection AddAuthentication(this IServiceCollection services, IConfiguration configuration, IHostEnvironment environment)
    {
        // Retrieve JWT configuration
        var jwt = configuration.GetSection("Jwt");
        var key = jwt["Key"] ?? throw new InvalidOperationException("Jwt:Key not configured");

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
