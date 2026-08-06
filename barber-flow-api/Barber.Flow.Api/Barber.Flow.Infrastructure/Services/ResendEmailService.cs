using System.Net.Http.Json;
using Barber.Flow.Domain.Interfaces;
using Barber.Flow.Infrastructure.Settings;
using Microsoft.Extensions.Options;

namespace Barber.Flow.Infrastructure.Services;

public class ResendEmailService(HttpClient httpClient, IOptions<ResendSettings> settings) : IEmailService
{
    private readonly ResendSettings _settings = settings.Value;

    public async Task SendEmailAsync(string to, string subject, string body, bool isHtml = true)
    {
        var payload = new
        {
            from = $"{_settings.FromName} <{_settings.FromEmail}>",
            to = new[] { to },
            subject,
            html = isHtml ? body : null,
            text = isHtml ? null : body
        };

        using var response = await httpClient.PostAsJsonAsync("emails", payload);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            throw new HttpRequestException($"Resend API returned {(int)response.StatusCode}: {error}");
        }
    }
}
