
namespace Barber.Flow.Application.Core.Sample.Queries;

public sealed class SampleQuery : ISampleQuery
{
    public async Task<string?> GetSampleDataAsync(string value)
    {
        return await Task.FromResult<string>($"Sample result endpoint with value {value}");
    }
}
