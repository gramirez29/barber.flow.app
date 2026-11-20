using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Barber.Flow.Api.Tests.Apis;

/// <summary>
/// The privacy policy is a static page (wwwroot/privacy-policy/index.html) linked from the mobile
/// and web apps and registered in the app stores. These links answered 404 until UseDefaultFiles
/// was added, so each form of the URL is pinned here.
/// </summary>
public class PrivacyPolicyTests : IClassFixture<ApiWebApplicationFactory>
{
    private readonly ApiWebApplicationFactory _factory;

    public PrivacyPolicyTests(ApiWebApplicationFactory factory) => _factory = factory;

    private HttpClient CreateClient(bool allowAutoRedirect = true) =>
        _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = allowAutoRedirect });

    [Fact]
    public async Task PrivacyPolicy_WithTrailingSlash_ServesThePage()
    {
        var response = await CreateClient().GetAsync("/privacy-policy/");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("text/html", response.Content.Headers.ContentType?.MediaType);
        Assert.Contains("Privacy Policy", await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task PrivacyPolicy_WithoutTrailingSlash_RedirectsToTheSlashForm()
    {
        var response = await CreateClient(allowAutoRedirect: false).GetAsync("/privacy-policy");

        Assert.Equal(HttpStatusCode.MovedPermanently, response.StatusCode);
        // The framework answers with an absolute URL; only its path matters here.
        var target = new Uri(new Uri("http://localhost"), response.Headers.Location);
        Assert.Equal("/privacy-policy/", target.AbsolutePath);
    }

    [Fact]
    public async Task PrivacyPolicy_WithoutTrailingSlash_EndsUpOnThePageWhenRedirectsAreFollowed()
    {
        var response = await CreateClient().GetAsync("/privacy-policy");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains("Privacy Policy", await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task PrivacyPolicy_DirectFilePath_StillWorks()
    {
        var response = await CreateClient().GetAsync("/privacy-policy/index.html");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task UnknownStaticPath_StillReturnsNotFound()
    {
        var response = await CreateClient().GetAsync("/no-such-page/");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
