using Barber.Flow.Api.Extensions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;

namespace Barber.Flow.Api.Tests.Extensions;

public class ApplicationExtensionsTests
{
    private sealed class FakeHostEnvironment : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = Environments.Development;
        public string ApplicationName { get; set; } = "Barber.Flow.Api.Tests";
        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }

    private static IConfiguration BuildConfig(string? jwtKey) => new ConfigurationBuilder()
        .AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Jwt:Key"] = jwtKey,
            ["Jwt:Issuer"] = "BarberFlowApi.Tests",
            ["Jwt:Audience"] = "BarberFlowApi.Tests",
        })
        .Build();

    [Fact]
    public void AddAuthentication_ProductionWithPlaceholderKey_Throws()
    {
        var services = new ServiceCollection();
        var config = BuildConfig("ReplaceViaRailwayEnvVar-Jwt__Key");
        var env = new FakeHostEnvironment { EnvironmentName = Environments.Production };

        Assert.Throws<InvalidOperationException>(() => services.AddAuthentication(config, env));
    }

    [Fact]
    public void AddAuthentication_ProductionWithShortKey_Throws()
    {
        var services = new ServiceCollection();
        var config = BuildConfig("too-short");
        var env = new FakeHostEnvironment { EnvironmentName = Environments.Production };

        Assert.Throws<InvalidOperationException>(() => services.AddAuthentication(config, env));
    }

    [Fact]
    public void AddAuthentication_ProductionWithValidKey_DoesNotThrow()
    {
        var services = new ServiceCollection();
        var config = BuildConfig("a-real-secret-key-that-is-at-least-32-bytes-long");
        var env = new FakeHostEnvironment { EnvironmentName = Environments.Production };

        var exception = Record.Exception(() => services.AddAuthentication(config, env));

        Assert.Null(exception);
    }

    [Fact]
    public void AddAuthentication_DevelopmentWithPlaceholderKey_DoesNotThrow()
    {
        var services = new ServiceCollection();
        var config = BuildConfig("ReplaceViaRailwayEnvVar-Jwt__Key");
        var env = new FakeHostEnvironment { EnvironmentName = Environments.Development };

        var exception = Record.Exception(() => services.AddAuthentication(config, env));

        Assert.Null(exception);
    }
}
