using Barber.Flow.Application.Services.Appointments;

namespace Barber.Flow.Application.Tests.Services.AppointmentsFeature;

public class RecurrenceCalculatorTests
{
    [Fact]
    public void Weekly_StepsSevenDaysAndKeepsWeekday()
    {
        var dates = RecurrenceCalculator.GetDates("2026-09-29", RecurrenceFrequency.Weekly, 4);

        Assert.Equal(new[] { "2026-09-29", "2026-10-06", "2026-10-13", "2026-10-20" }, dates);
    }

    [Fact]
    public void Biweekly_StepsFourteenDaysAndKeepsWeekday()
    {
        var dates = RecurrenceCalculator.GetDates("2026-09-29", RecurrenceFrequency.Biweekly, 3);

        Assert.Equal(new[] { "2026-09-29", "2026-10-13", "2026-10-27" }, dates);
        Assert.All(dates, d => Assert.Equal(DayOfWeek.Tuesday, DateTime.Parse(d).DayOfWeek));
    }

    [Fact]
    public void Monthly_FromJan31_ClampsToMonthEndWithoutDrifting_NonLeapYear()
    {
        var dates = RecurrenceCalculator.GetDates("2026-01-31", RecurrenceFrequency.Monthly, 4);

        Assert.Equal(new[] { "2026-01-31", "2026-02-28", "2026-03-31", "2026-04-30" }, dates);
    }

    [Fact]
    public void Monthly_FromJan31_UsesFeb29InLeapYear()
    {
        var dates = RecurrenceCalculator.GetDates("2028-01-31", RecurrenceFrequency.Monthly, 3);

        Assert.Equal(new[] { "2028-01-31", "2028-02-29", "2028-03-31" }, dates);
    }

    [Fact]
    public void Monthly_CrossesYearBoundary()
    {
        var dates = RecurrenceCalculator.GetDates("2026-11-15", RecurrenceFrequency.Monthly, 3);

        Assert.Equal(new[] { "2026-11-15", "2026-12-15", "2027-01-15" }, dates);
    }

    [Fact]
    public void CountIncludesTheFirstOccurrence()
    {
        Assert.Equal(12, RecurrenceCalculator.GetDates("2026-09-29", RecurrenceFrequency.Weekly, 12).Count);
        Assert.Single(RecurrenceCalculator.GetDates("2026-09-29", RecurrenceFrequency.Weekly, 1));
    }

    [Fact]
    public void InvalidStartDate_Throws()
    {
        Assert.Throws<AppointmentSchedulingException>(
            () => RecurrenceCalculator.GetDates("not-a-date", RecurrenceFrequency.Weekly, 3));
    }

    [Theory]
    [InlineData("weekly", RecurrenceFrequency.Weekly)]
    [InlineData("BIWEEKLY", RecurrenceFrequency.Biweekly)]
    [InlineData(" monthly ", RecurrenceFrequency.Monthly)]
    public void TryParseFrequency_AcceptsKnownValues(string value, RecurrenceFrequency expected)
    {
        Assert.True(RecurrenceCalculator.TryParseFrequency(value, out var actual));
        Assert.Equal(expected, actual);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("daily")]
    public void TryParseFrequency_RejectsUnknownValues(string? value)
    {
        Assert.False(RecurrenceCalculator.TryParseFrequency(value, out _));
    }
}
