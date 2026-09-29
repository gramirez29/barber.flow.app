namespace Barber.Flow.Api.DTOs.Requests;

public record BarberSettingsDto
(
    decimal CommissionPercentage,
    decimal FixedDailyExpense,
    // 0..20. 0 = recurring appointments disabled. Omit (null) on update to keep the stored value.
    int? MaxRecurringAppointments = null
);
