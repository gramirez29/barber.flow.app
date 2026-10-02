namespace Barber.Flow.Application.Services.Clients;

public static class PhoneNormalizer
{
    private const string CostaRicaCountryCode = "506";

    /// <summary>
    /// Reduces a phone number to comparable digits so "8888-0000", "88880000" and "+506 8888 0000"
    /// are the same number. Returns null when there are no digits to compare.
    /// </summary>
    public static string? Normalize(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone)) return null;

        var digits = new string(phone.Where(char.IsDigit).ToArray());
        if (digits.Length == 0) return null;

        // Costa Rica numbers are 8 digits; drop the country code when it was typed in front.
        if (digits.Length == CostaRicaCountryCode.Length + 8 && digits.StartsWith(CostaRicaCountryCode, StringComparison.Ordinal))
        {
            digits = digits[CostaRicaCountryCode.Length..];
        }

        return digits;
    }
}
