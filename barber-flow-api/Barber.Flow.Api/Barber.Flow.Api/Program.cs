using Barber.Flow.Api.Apis;
using Barber.Flow.Api.Extensions;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.HttpOverrides;

var builder = WebApplication.CreateBuilder(args);

// Escuchar en el puerto que Railway (u otro host) asigne vía PORT; fallback a 7016 en local
var port = Environment.GetEnvironmentVariable("PORT") ?? "7016";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

// Add services to the container.
builder.Services.AddApplicationServices(builder.Configuration, builder.Environment);
builder.Services.AddAuthentication(builder.Configuration, builder.Environment);
builder.Services.AddAllowCORS(builder.Configuration);
builder.Services.AddAuthRateLimiting(builder.Environment);

// Confiar en los headers de proxy de Railway (X-Forwarded-Proto, X-Forwarded-For)
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();     
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Atrapa cualquier excepción no manejada y devuelve un JSON genérico en vez de dejarla
// propagarse sin controlar (o filtrar detalles internos si el ambiente queda mal configurado).
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        var exception = context.Features.Get<IExceptionHandlerFeature>()?.Error;
        if (exception != null)
        {
            var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogError(exception, "Unhandled exception processing {Method} {Path}", context.Request.Method, context.Request.Path);
        }

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        await context.Response.WriteAsJsonAsync(new { message = "Ha ocurrido un error inesperado." });
    });
});

// Procesar headers de Railway antes que cualquier otro middleware
app.UseForwardedHeaders();

app.UseStaticFiles();

// IMPORTANTE: UseCors debe ir ANTES de UseAuthorization y UseEndpoints
app.UseCors("AllowExpoApp");
app.UseRateLimiter();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapSampleApi();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapAuthApi();
app.MapClientsApi();
app.MapBarbersApi();
app.MapBarberShopsApi();
app.MapReportsApi();
app.MapUsersApi();
app.MapAppointmentsApi();
app.Run();

// Exposes the top-level-statements Program class so WebApplicationFactory<Program> in
// Barber.Flow.Api.Tests can reference it from another assembly.
public partial class Program { }