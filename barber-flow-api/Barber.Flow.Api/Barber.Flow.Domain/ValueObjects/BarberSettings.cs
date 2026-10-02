namespace Barber.Flow.Domain.ValueObjects;

public record BarberSettings
(
    decimal CommissionPercentage,
    decimal FixedDailyExpense,
    // Max number of appointments in one recurring series (0..20). null/0 = recurrence disabled.
    // Only the admin sets it; null on update means "keep the current value".
    int? MaxRecurringAppointments = null,
    // Turns on adjustable appointment durations (overlap-based conflicts) for this barber. Only the admin
    // sets it; null on update means "keep the current value". Off (null/false) = behavior as before.
    bool? EnableAppointmentDurations = null
);
