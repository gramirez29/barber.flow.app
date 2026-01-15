namespace Barber.Flow.Application.Core.Sample.Queries;

public interface ISampleQuery
{
    Task<string?> GetSampleDataAsync(string value);
}
