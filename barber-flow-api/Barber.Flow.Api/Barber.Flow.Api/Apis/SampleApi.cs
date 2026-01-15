using Barber.Flow.Application.Core.Sample.Queries;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Barber.Flow.Api.Apis;

public static class SampleApi
{
    private const string SampleMininalApiEndpoint = "Sample Mininal Api Endpoint";

    public static RouteGroupBuilder MapSampleApi(this IEndpointRouteBuilder app)
    {
        var api = app.MapGroup($"api/sample");

        api.MapGet("/sample-endpoint", SampleEndPointAsync).WithName(nameof(SampleEndPointAsync)).WithTags(SampleMininalApiEndpoint);

        return api;
    }

    /// <summary>
    /// Handles a sample API endpoint request asynchronously and returns a result indicating success or a bad request
    /// error.
    /// </summary>
    /// <returns>A <see cref="Results{Ok{string}, BadRequest{string}}"/> representing the outcome of the operation. Returns an
    /// <see cref="Ok{string}"/> result containing the sample data if available; otherwise, returns a <see
    /// cref="BadRequest{string}"/> result with an error message.</returns>
    private static async Task<Results<Ok<string>, BadRequest<string>>> SampleEndPointAsync(ISampleQuery sampleQuery)
    {
        var sampleData = await sampleQuery.GetSampleDataAsync("BarberFlow Service").ConfigureAwait(false);

        return sampleData == null ? TypedResults.BadRequest("Error found.") : TypedResults.Ok(sampleData);
    }
}
