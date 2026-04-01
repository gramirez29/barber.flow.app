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
using Barber.Flow.Application.Services.Users;
using Barber.Flow.Application.Services.Reports;

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

        services.AddScoped<IClientService, ClientService>();
        services.AddSingleton<IClientRepository, InMemoryClientRepository>();
        
        services.AddScoped<IBarberService, BarberService>();
        services.AddSingleton<IBarberRepository, InMemoryBarberRepository>();

        services.AddScoped<IUserService, UserService>();
        services.AddSingleton<IUserRepository, InMemoryUserRepository>();

        services.AddScoped<IReportService, ReportService>();
        services.AddSingleton<IReportRepository, InMemoryReportRepository>();

        // services.AddSwaggerDocumentation(configuration);

        return services;
    }

    public static IServiceCollection AddAllowCORS(this IServiceCollection services) 
    {
        services.AddCors(options =>
        {
            options.AddPolicy("AllowLocalhost", policy =>
            {
                policy
                    .WithOrigins("http://localhost:8081")
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
