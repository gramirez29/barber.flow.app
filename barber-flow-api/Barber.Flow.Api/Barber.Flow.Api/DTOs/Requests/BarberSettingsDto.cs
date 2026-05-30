namespace Barber.Flow.Api.DTOs.Requests;

public record BarberSettingsDto
(
    decimal CommissionPercentage,
    decimal FixedDailyExpense
);
