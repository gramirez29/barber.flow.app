using Barber.Flow.Domain.Interfaces;

namespace Barber.Flow.Infrastructure.Services;

public class ConsoleEmailService : IEmailService
{
    public Task SendEmailAsync(string to, string subject, string body, bool isHtml = true)
    {
        Console.WriteLine("================================================");
        Console.WriteLine($"SENDING EMAIL TO: {to}");
        Console.WriteLine($"SUBJECT: {subject}");
        Console.WriteLine($"BODY: {body}");
        Console.WriteLine("================================================");
        return Task.CompletedTask;
    }
}