namespace Barber.Flow.Infrastructure.Settings;

public sealed record FeatureFlags
{
    public bool UseMongoDb { get; init; } = false;
    public bool UseRealEmail { get; init; } = false;
}
