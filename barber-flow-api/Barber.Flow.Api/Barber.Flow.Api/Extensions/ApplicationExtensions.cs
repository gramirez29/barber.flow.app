using Barber.Flow.Application.Services.Auth;
using Barber.Flow.Application.Services.Sample.Queries;
using Barber.Flow.Domain.Interfaces;
using Barber.Flow.Infrastructure.Services.Auth;
using Microsoft.OpenApi.Models;
using System.Reflection;

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

        services.AddTransient<ISampleQuery, SampleQuery>();

        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IJwtAuthService, JwtAuthService>();

        // services.AddSwaggerDocumentation(configuration);

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
