namespace Barber.Flow.Api.DTOs.Requests;

public class AuthRequest
{
    public string UserName { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;
}
