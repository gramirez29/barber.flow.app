using Barber.Flow.Api.Apis;
using Barber.Flow.Api.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Escuchar en el puerto que Railway (u otro host) asigne vía PORT; fallback a 7016 en local
var port = Environment.GetEnvironmentVariable("PORT") ?? "7016";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

// Add services to the container.
builder.Services.AddApplicationServices(builder.Configuration, builder.Environment);
builder.Services.AddAuthentication(builder.Configuration, builder.Environment);
builder.Services.AddAllowCORS();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();     
builder.Services.AddSwaggerGen();

var app = builder.Build();

// IMPORTANTE: UseCors debe ir ANTES de UseAuthorization y UseEndpoints
app.UseCors("AllowExpoApp");

// Swagger habilitado en todos los entornos
app.UseSwagger();
app.UseSwaggerUI();

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