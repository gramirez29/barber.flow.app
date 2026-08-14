namespace Barber.Flow.Domain.ValueObjects;

public record BarberSettings
(
    decimal CommissionPercentage,
    decimal FixedDailyExpense
);
