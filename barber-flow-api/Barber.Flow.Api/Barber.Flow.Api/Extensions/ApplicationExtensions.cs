using Barber.Flow.Application.Core.Sample.Queries;
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
