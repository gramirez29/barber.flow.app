using Barber.Flow.Api.Apis;
using Barber.Flow.Api.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddApplicationServices(builder.Configuration, builder.Environment);
builder.Services.AddAuthentication(builder.Configuration, builder.Environment);

if (builder.Environment.IsDevelopment())
{
    builder.Services.AddAllowCORS();
}

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();     
builder.Services.AddSwaggerGen();

var app = builder.Build();  // ← Now build after all services are registered

// IMPORTANTE: UseCors debe ir ANTES de UseAuthorization y UseEndpoints
app.UseCors("AllowExpoApp");

// Esto es CRÍTICO para que escuche desde cualquier dispositivo
var port = Environment.GetEnvironmentVariable("PORT") ?? "7016";
app.Urls.Add($"http://0.0.0.0:{port}");

// Configure middleware pipeline
// Enable Swagger in development and production (for Railway)
if (app.Environment.IsDevelopment() || app.Environment.IsProduction())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapSampleApi();
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapAuthApi();
app.MapClientsApi();
app.MapBarbersApi();
app.MapReportsApi();
app.MapUsersApi();
app.MapAppointmentsApi();
app.Run();