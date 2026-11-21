using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Barber.Flow.Api.DTOs.Requests;
using Barber.Flow.Api.DTOs.Responses;

namespace Barber.Flow.Api.Tests.Apis;

/// <summary>
/// Weekly and monthly reports (Sunday-to-Saturday weeks, calendar months). The test host uses the
/// in-memory report repository, so these tests pin the endpoint contract (auth, validation, shape and
/// period boundaries); the figures themselves are covered by the repository tests.
/// </summary>
public class ReportsApiTests : IClassFixture<ApiWebApplicationFactory>
{
    private readonly ApiWebApplicationFactory _factory;

    public ReportsApiTests(ApiWebApplicationFactory factory) => _factory = factory;

    private async Task<HttpClient> LoginAsync(string userName, string password)
    {
        var client = _factory.CreateClient();
        var loginResponse = await client.PostAsJsonAsync("/api/users/authentication", new AuthRequest { UserName = userName, Password = password });
        var user = await loginResponse.Content.ReadFromJsonAsync<UserResponse>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", user!.Token);
        return client;
    }

    [Theory]
    [InlineData("/api/reports/weekly")]
    [InlineData("/api/reports/monthly")]
    public async Task Period_WithoutToken_ReturnsUnauthorized(string url)
    {
        var response = await _factory.CreateClient().GetAsync(url);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Theory]
    [InlineData("/api/reports/weekly?date=not-a-date")]
    [InlineData("/api/reports/weekly?date=2026-13-40")]
    [InlineData("/api/reports/weekly?date=15/11/2026")]
    [InlineData("/api/reports/monthly?month=2026-13")]
    [InlineData("/api/reports/monthly?month=nov-2026")]
    [InlineData("/api/reports/monthly?month=2026-11-20")]
    public async Task Period_WithInvalidParameter_ReturnsBadRequest(string url)
    {
        var client = await LoginAsync("admin", "password");

        var response = await client.GetAsync(url);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Weekly_ReturnsTheSundayToSaturdayWeekWithOneEntryPerDay()
    {
        var client = await LoginAsync("admin", "password");

        // 2026-11-18 is a Wednesday; its week runs Sunday 15th to Saturday 21st.
        var report = await client.GetFromJsonAsync<PeriodReportResponse>("/api/reports/weekly?date=2026-11-18");

        Assert.NotNull(report);
        Assert.Equal("weekly", report!.PeriodType);
        Assert.Equal(new DateOnly(2026, 11, 15), report.From);
        Assert.Equal(new DateOnly(2026, 11, 21), report.To);
        var days = report.Days.ToList();
        Assert.Equal(7, days.Count);
        Assert.Equal(Enumerable.Range(15, 7).Select(d => new DateOnly(2026, 11, d)), days.Select(d => d.Date));
        Assert.Equal(days.Sum(d => d.GrossRevenue), report.GrossRevenue);
        Assert.Equal(days.Sum(d => d.NetProfit), report.NetProfit);
    }

    [Fact]
    public async Task Weekly_WithoutDate_ReturnsTheCurrentWeek()
    {
        var client = await LoginAsync("admin", "password");

        var report = await client.GetFromJsonAsync<PeriodReportResponse>("/api/reports/weekly");

        Assert.NotNull(report);
        Assert.Equal(DayOfWeek.Sunday, report!.From.DayOfWeek);
        Assert.Equal(DayOfWeek.Saturday, report.To.DayOfWeek);
        Assert.Equal(7, report.Days.Count());
    }

    [Theory]
    [InlineData("2026-11", 30)]
    [InlineData("2026-12", 31)]
    [InlineData("2026-02", 28)]
    [InlineData("2028-02", 29)]
    public async Task Monthly_ReturnsEveryDayOfTheCalendarMonth(string month, int expectedDays)
    {
        var client = await LoginAsync("admin", "password");

        var report = await client.GetFromJsonAsync<PeriodReportResponse>($"/api/reports/monthly?month={month}");

        Assert.NotNull(report);
        Assert.Equal("monthly", report!.PeriodType);
        Assert.Equal(1, report.From.Day);
        Assert.Equal(expectedDays, report.To.Day);
        Assert.Equal(expectedDays, report.Days.Count());
    }

    [Fact]
    public async Task Monthly_WithoutMonth_ReturnsTheCurrentMonth()
    {
        var client = await LoginAsync("admin", "password");

        var report = await client.GetFromJsonAsync<PeriodReportResponse>("/api/reports/monthly");

        Assert.NotNull(report);
        Assert.Equal(1, report!.From.Day);
        Assert.Equal(report.From.Month, report.To.Month);
    }

    [Fact]
    public async Task Period_ExposesTheExpectedJsonFields()
    {
        var client = await LoginAsync("barber", "barber");

        var json = await client.GetStringAsync("/api/reports/weekly?date=2026-11-18");
        using var document = JsonDocument.Parse(json);
        var root = document.RootElement;

        foreach (var field in new[]
        {
            "periodType", "from", "to", "countedDays", "totalCustomersServed", "grossRevenue",
            "commissionAmount", "fixedDailyExpense", "fixedExpenseTotal", "netProfit",
            "paymentMethodBreakdown", "days", "generatedAt",
        })
        {
            Assert.True(root.TryGetProperty(field, out _), $"missing field '{field}'");
        }

        var firstDay = root.GetProperty("days")[0];
        foreach (var field in new[] { "date", "totalCustomersServed", "grossRevenue", "commissionAmount", "fixedExpense", "netProfit" })
        {
            Assert.True(firstDay.TryGetProperty(field, out _), $"missing day field '{field}'");
        }

        Assert.Equal("2026-11-15", root.GetProperty("from").GetString());
    }
}
