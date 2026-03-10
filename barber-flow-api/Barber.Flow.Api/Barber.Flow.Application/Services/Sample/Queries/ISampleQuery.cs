namespace Barber.Flow.Application.Services.Sample.Queries;

public interface ISampleQuery
{
    Task<string?> GetSampleDataAsync(string value);
}
