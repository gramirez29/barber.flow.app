using Barber.Flow.Domain.ValueObjects;

namespace Barber.Flow.Domain.Tests;

public class AppointmentSearchLimitsTests
{
    [Fact]
    public void DateSearchWithoutPaging_IsUnpagedUpToTheSafetyCap()
    {
        var (skip, take) = AppointmentSearchLimits.Resolve(hasDateFilter: true, page: null, pageSize: null);

        Assert.Equal(0, skip);
        Assert.Equal(AppointmentSearchLimits.MaxUnpagedResults, take);
    }

    [Fact]
    public void SearchWithoutDateAndWithoutPaging_UsesTheDefaultPage()
    {
        var (skip, take) = AppointmentSearchLimits.Resolve(hasDateFilter: false, page: null, pageSize: null);

        Assert.Equal(0, skip);
        Assert.Equal(AppointmentSearchLimits.DefaultPageSize, take);
    }

    [Theory]
    [InlineData(1, 20, 0, 20)]
    [InlineData(3, 20, 40, 20)]
    [InlineData(2, 10000, 100, 100)]
    [InlineData(0, 25, 0, 25)]
    [InlineData(-4, 25, 0, 25)]
    public void ExplicitPaging_IsHonoredAndPageSizeIsCapped(int page, int pageSize, int expectedSkip, int expectedTake)
    {
        var (skip, take) = AppointmentSearchLimits.Resolve(hasDateFilter: true, page, pageSize);

        Assert.Equal(expectedSkip, skip);
        Assert.Equal(expectedTake, take);
    }

    [Fact]
    public void OnlyPageGiven_StillPaginatesWithTheDefaultSize()
    {
        var (skip, take) = AppointmentSearchLimits.Resolve(hasDateFilter: true, page: 2, pageSize: null);

        Assert.Equal(AppointmentSearchLimits.DefaultPageSize, skip);
        Assert.Equal(AppointmentSearchLimits.DefaultPageSize, take);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void PageSizeBelowOne_IsRaisedToOne(int pageSize)
    {
        var (_, take) = AppointmentSearchLimits.Resolve(hasDateFilter: false, page: 1, pageSize);

        Assert.Equal(1, take);
    }
}
