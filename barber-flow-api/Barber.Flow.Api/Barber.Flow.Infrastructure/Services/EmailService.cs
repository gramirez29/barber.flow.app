using Barber.Flow.Domain.Interfaces;
using Barber.Flow.Infrastructure.Settings;
using Microsoft.Extensions.Options;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace Barber.Flow.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly EmailSettings _settings;

    public EmailService(IOptions<EmailSettings> settings)
    {
        _settings = settings.Value;
    }

    public async Task SendEmailAsync(string to, string subject, string body, bool isHtml = true)
    {
        var email = new MimeMessage();
        email.From.Add(new MailboxAddress(_settings.FromName, _settings.FromEmail));
        email.To.Add(MailboxAddress.Parse(to));
        email.Subject = subject;

        var builder = new BodyBuilder { TextBody = isHtml ? string.Empty : body, HtmlBody = isHtml ? body : string.Empty };
        email.Body = builder.ToMessageBody();

        using var smtp = new SmtpClient();
        try
        {
            await smtp.ConnectAsync(_settings.SmtpServer, _settings.SmtpPort, _settings.EnableSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.None);
            await smtp.AuthenticateAsync(_settings.SmtpUsername, _settings.SmtpPassword);
            await smtp.SendAsync(email);
        }
        finally
        {
            await smtp.DisconnectAsync(true);
        }
    }
}