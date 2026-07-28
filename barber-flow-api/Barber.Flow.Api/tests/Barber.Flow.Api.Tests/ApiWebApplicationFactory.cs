using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

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
        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Features:UseMongoDb"] = "false",
                ["Features:UseRealEmail"] = "false",
            });
        });
    }
}
