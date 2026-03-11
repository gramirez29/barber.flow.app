namespace Barber.Flow.Api.DTOs.Requests;

public record ClientRequest(
    string FirstName,
    string LastName,
    string Phone,
    string? Address,
    DateTime? Birthday,
    string? Preferences,
    string? PaymentMethod,
    bool Active
);
