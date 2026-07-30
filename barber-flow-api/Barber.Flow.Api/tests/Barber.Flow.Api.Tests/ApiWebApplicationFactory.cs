using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Barber.Flow.Api.Tests;

/// <summary>
/// Boots the API in-memory against the InMemory repositories (Features:UseMongoDb=false) and
/// with real email sending disabled, so integration tests never touch Mongo or SMTP.
/// </summary>
public class ApiWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        // UseSetting is the reliable override mechanism for WebApplicationFactory: it writes
        // directly into the web host builder's settings, which take precedence over
        // appsettings.json/appsettings.{Environment}.json. ConfigureAppConfiguration's
        // AddInMemoryCollection does NOT reliably win against those files for a minimal-hosting
        // Program.cs (confirmed: appsettings.json ships with Features:UseMongoDb=true, and without
        // this fix the test host still tried to bootstrap a real Mongo connection and failed in CI,
        // where no Mongo instance is available).
        builder.UseSetting("Features:UseMongoDb", "false");
        builder.UseSetting("Features:UseRealEmail", "false");
    }
}
