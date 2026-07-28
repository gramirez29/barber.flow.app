using Barber.Flow.Api.DTOs.Requests;

namespace Barber.Flow.Api.Tests.Validators;

public class BarberRequestValidatorTests
{
    private readonly BarberRequestValidator _validator = new();

    private static BarberRequest BuildValidRequest(BarberSettingsDto? settings = null) => new(
        UserName: "Main Barber",
        UserPhone: "8888-0000",
        UserEmail: "barber@example.com",
        BarberName: "Main Barber",
        BarberPhone: "8888-0000",
        Address: null,
        BarberShopName: null,
        BarberShopPhone: null,
        PhotoUrl: null,
        Password: null,
        Settings: settings,
        ShopId: null
    );

    [Fact]
    public void Validate_ValidRequest_HasNoErrors()
    {
        var result = _validator.Validate(BuildValidRequest());

        Assert.True(result.IsValid);
    }

    [Theory]
    [InlineData("88880000")]
    [InlineData("8888-00000")]
    [InlineData("")]
    public void Validate_InvalidUserPhoneFormat_HasError(string phone)
    {
        var request = BuildValidRequest() with { UserPhone = phone };

        var result = _validator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BarberRequest.UserPhone));
    }

    [Theory]
    [InlineData("not-an-email")]
    [InlineData("")]
    public void Validate_InvalidUserEmail_HasError(string email)
    {
        var request = BuildValidRequest() with { UserEmail = email };

        var result = _validator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BarberRequest.UserEmail));
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(101)]
    public void Validate_CommissionPercentageOutOfRange_HasError(decimal commission)
    {
        var request = BuildValidRequest(new BarberSettingsDto(commission, 10000m));

        var result = _validator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Settings.CommissionPercentage");
    }

    [Fact]
    public void Validate_NegativeFixedDailyExpense_HasError()
    {
        var request = BuildValidRequest(new BarberSettingsDto(40m, -1m));

        var result = _validator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Settings.FixedDailyExpense");
    }

    [Fact]
    public void Validate_NoSettingsProvided_DoesNotValidateSettingsFields()
    {
        var result = _validator.Validate(BuildValidRequest(settings: null));

        Assert.True(result.IsValid);
    }
}
