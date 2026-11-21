namespace Barber.Flow.Domain.ValueObjects;

/// <summary>
/// How many appointments a search returns. Shared by every <c>IAppointmentRepository</c> so the Mongo
/// and in-memory implementations can't drift apart.
/// </summary>
/// <remarks>
/// A search used to ALWAYS paginate (50 by default, 100 at most) and none of the clients ever asked for
/// a page, so any date range with more than 50 appointments was silently cut to its first 50 (the
/// oldest ones, since results are ordered by date): month/week calendar views, notifications and
/// reports lost the later days without any error. A date search that doesn't ask for a page now
/// returns the whole range, bounded by <see cref="MaxUnpagedResults"/> as a safety net.
/// </remarks>
public static class AppointmentSearchLimits
{
    public const int DefaultPageSize = 50;

    public const int MaxPageSize = 100;

    /// <summary>
    /// Upper bound for a date search that didn't ask for a page. One barber rarely has more than a few
    /// hundred appointments a month; this only guards against an unbounded read (e.g. the admin
    /// account, which sees every barber, asking for a very long range).
    /// </summary>
    public const int MaxUnpagedResults = 5000;

    /// <summary>
    /// Resolves how many documents to skip and take for a search.
    /// </summary>
    /// <param name="hasDateFilter">True when the search is restricted to a date or a date range.</param>
    /// <param name="page">Requested page (1-based), if any.</param>
    /// <param name="pageSize">Requested page size, if any.</param>
    public static (int Skip, int Take) Resolve(bool hasDateFilter, int? page, int? pageSize)
    {
        if (hasDateFilter && page is null && pageSize is null)
        {
            return (0, MaxUnpagedResults);
        }

        var take = Math.Clamp(pageSize ?? DefaultPageSize, 1, MaxPageSize);
        var pageIndex = Math.Max(0, (page ?? 1) - 1);
        return (pageIndex * take, take);
    }
}
